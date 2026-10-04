"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_DRIVER_NOTIFICATIONS, SEED_OPERATOR_NOTIFICATIONS } from "../data/misc";
import { makeId } from "../format";
import type { AppNotification } from "../types";

type Inbox = "driver" | "operator";

/** Notifications for the driver and operator apps. (The rider's live in the booking store.) */
interface AlertState {
  driver: AppNotification[];
  operator: AppNotification[];
  push: (who: Inbox, n: Omit<AppNotification, "id" | "time" | "unread">) => void;
  markRead: (who: Inbox, id: string) => void;
  markAllRead: (who: Inbox) => void;
}

export const useAlerts = create<AlertState>()(
  persist(
    (set) => ({
      driver: SEED_DRIVER_NOTIFICATIONS,
      operator: SEED_OPERATOR_NOTIFICATIONS,
      push: (who, n) => set((s) => ({ [who]: [{ ...n, id: makeId("n"), time: "Now", unread: true }, ...s[who]] }) as Partial<AlertState>),
      markRead: (who, id) => set((s) => ({ [who]: s[who].map((n) => (n.id === id ? { ...n, unread: false } : n)) }) as Partial<AlertState>),
      markAllRead: (who) => set((s) => ({ [who]: s[who].map((n) => ({ ...n, unread: false })) }) as Partial<AlertState>),
    }),
    { name: "myway.alerts", skipHydration: true },
  ),
);
