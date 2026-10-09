import { api, ApiError } from "./client";
import type { Role } from "../types";

export interface ApiUser { id: string; name: string; phone: string; role: Role; id_verified: boolean }

/** Ask the server to text a 6-digit code. "A code was just sent" (429) is fine: the earlier code still works. */
export async function requestOtp(phone: string) {
  try {
    await api("/auth/otp/request", { body: { phone } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) return;
    throw e;
  }
}

/** Existing account: { phone, code }. New account: also name + role. A new number without name/role fails with extra.new_account = true. */
export const verifyOtp = (b: { phone: string; code: string; name?: string; role?: Role }) =>
  api<{ token: string; user: ApiUser }>("/auth/otp/verify", { body: b });

export const isNewAccount = (e: unknown) => e instanceof ApiError && e.extra.new_account === true;

/** The server checks the NIN's shape and discards it. */
export const submitNin = (nin: string) => api<ApiUser>("/me/verify-id", { body: { nin, selfie_captured: true } });
