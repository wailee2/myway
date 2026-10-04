import type { AppNotification, Transaction } from "../types";

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: "x1", title: "Top up · Bank transfer", sub: "Mon", amount: 5000, icon: "bank" },
  { id: "x2", title: "Fuel cashback", sub: "Sun", amount: 150, icon: "fuel" },
  { id: "x3", title: "Bus N1 ticket", sub: "Fri", amount: -700, icon: "bus" },
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", icon: "car", title: "Ade is 4 min away", body: "Show code 4821 when you board.", time: "7:04", unread: true },
  { id: "n2", icon: "bus", title: "Bus N1 confirmed", body: "Seat 4B · Tomorrow 7:30 · Bay 3", time: "6:12" },
  { id: "n3", icon: "wallet", title: "Wallet credited ₦5,000", body: "Bank transfer received.", time: "Mon" },
  { id: "n4", icon: "star", title: "Rate your ride with Chioma", body: "Takes five seconds.", time: "Fri" },
  { id: "n5", icon: "route", title: "Lugbe → Wuse is at 37 of 50 riders", body: "13 more riders unlock the route.", time: "Thu" },
];

export const FAQ = [
  { q: "What is MYWAY?", a: "MYWAY lets you book a seat in a shared car or on a scheduled bus in Abuja. You see the price first, pick your seat, and the car leaves when it is full or on time." },
  { q: "How is this different from the usual “along”?", a: "You book before you leave home, there are never more than four passengers in a car, and the driver does not stop to hunt for more people. Every driver and rider is ID-verified." },
  { q: "Can I pay with cash?", a: "Yes. Choose cash and a small hold is taken from your wallet to secure the seat. You can also pay by wallet, bank transfer or card." },
  { q: "What if my driver does not show up?", a: "You are refunded to your wallet automatically and we offer the next car or bus on your route." },
  { q: "How do drivers earn?", a: "Drivers post trips they already make, sell up to four seats, and get paid daily. MYWAY keeps a commission per seat and adds fuel cashback." },
  { q: "Is this a real product yet?", a: "Not yet. This is an MVP that shows how MYWAY will look and work. Bookings, drivers and payments here are simulated." },
];
