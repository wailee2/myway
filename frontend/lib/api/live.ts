/**
 * Talk to the real backend (FastAPI) instead of the on-device stand-ins.
 * On by default; set NEXT_PUBLIC_LIVE_API=false to run the frontend alone on local demo data.
 */
export const LIVE = process.env.NEXT_PUBLIC_LIVE_API !== "false";
