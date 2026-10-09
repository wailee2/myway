/** Where "Chat with us" and "Call" go. Set these in .env; with no value the control is hidden rather than pointing at a fake number. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "";
