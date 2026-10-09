"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** True while the device has a network connection. Server render assumes online. */
export const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
