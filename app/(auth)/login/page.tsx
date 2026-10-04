import type { Metadata } from "next";
import { Login } from "@/features/auth/login";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <Login />;
}
