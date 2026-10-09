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

export const SEED_DRIVER_NOTIFICATIONS: AppNotification[] = [
  { id: "dn1", icon: "users", title: "3 riders are waiting on your route", body: "Nyanya Bridge to CBD. Post a 7:10 trip to pick them up.", time: "6:40", unread: true },
  { id: "dn2", icon: "doc", title: "Roadworthiness expires in 12 days", body: "Upload a renewal in Vehicle and documents.", time: "Yesterday", unread: true },
  { id: "dn3", icon: "bank", title: "Payout sent ₦18,500", body: "GTBank •• 4021. Instant transfer.", time: "Mon" },
  { id: "dn4", icon: "star", title: "Chioma left you 5 stars", body: "“Smooth ride and on time.”", time: "Fri" },
  { id: "dn5", icon: "trend", title: "Weekly bonus: 8 trips to go", body: "Finish them by Sunday to unlock ₦5,000.", time: "Thu" },
];

export const SEED_OPERATOR_NOTIFICATIONS: AppNotification[] = [
  { id: "on1", icon: "bus", title: "N1 · 7:30 is almost full", body: "16 of 18 seats sold. Consider adding a 7:45 bus.", time: "6:55", unread: true },
  { id: "on2", icon: "alert", title: "Bus ABJ-221-XA is due for service", body: "Last serviced 92 days ago.", time: "6:10", unread: true },
  { id: "on3", icon: "wallet", title: "Settlement of ₦412,000 paid", body: "For the week ending Sunday.", time: "Mon" },
  { id: "on4", icon: "route", title: "Lugbe → Garki has 41 riders waiting", body: "Riders asked for this route. Add a trip to serve it.", time: "Sun" },
  { id: "on5", icon: "star", title: "Cityline Coaches is rated 4.7", body: "Up 0.1 from last month.", time: "Sat" },
];

export const SEED_REVIEWS = [
  { id: "r1", name: "Chioma E.", stars: 5, text: "Smooth ride and on time. Car was clean.", when: "Fri" },
  { id: "r2", name: "Tunde A.", stars: 5, text: "Knows the shortcuts around Nyanya. Fast.", when: "Thu" },
  { id: "r3", name: "Amina Y.", stars: 4, text: "Good driver. Left a few minutes late.", when: "Wed" },
  { id: "r4", name: "Ibrahim S.", stars: 5, text: "Polite, calm, and the AC worked.", when: "Mon" },
];

export const DRIVER_FAQ = [
  { q: "How and when do I get paid?", a: "Fares land in your MYWAY balance when you end a trip. Withdraw to your bank any time. It is instant, and free once a day." },
  { q: "What is the commission?", a: "MYWAY keeps 10% of each seat sold. Fuel cashback and weekly bonuses are added on top." },
  { q: "A rider did not show up. What now?", a: "Wait the grace period shown on your trip, then end the trip. You are still paid for seats that were booked and prepaid." },
  { q: "How do I verify a rider?", a: "Ask for the 4-digit boarding code and enter it on your live trip screen." },
  { q: "My documents are expiring.", a: "Open Vehicle and documents from your profile and upload the renewal. Review takes up to 24 hours." },
];

export const OPERATOR_FAQ = [
  { q: "How do I add a trip?", a: "From the dashboard tap Add trip, pick the line, time and bus, then publish. Riders see it straight away." },
  { q: "How do I check tickets?", a: "Open Scan tickets and scan the rider's QR, or type the code, for example N1-4B." },
  { q: "When are settlements paid?", a: "Weekly, every Monday, to the bank account on your company profile." },
  { q: "How do I take a bus out of service?", a: "Open Fleet, tap the bus, and set it to Maintenance. It will not be offered on new trips." },
];

export const FAQ = [
  { q: "What is MYWAY?", a: "MYWAY lets you book a seat in a shared car or on a scheduled bus in Abuja. You see the price first, pick your seat, and the car leaves when it is full or on time." },
  { q: "How is this different from the usual “along”?", a: "You book before you leave home, there are never more than four passengers in a car, and the driver does not stop to hunt for more people. Every driver and rider is ID-verified." },
  { q: "Can I pay with cash?", a: "Yes. Choose cash and a small hold is taken from your wallet to secure the seat. You can also pay by wallet, bank transfer or card." },
  { q: "What if my driver does not show up?", a: "You are refunded to your wallet automatically and we offer the next car or bus on your route." },
  { q: "How do drivers earn?", a: "Drivers post trips they already make, sell up to four seats, and get paid daily. MYWAY keeps a commission per seat and adds fuel cashback." },
];
