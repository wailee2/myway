"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Dir = "none" | "push" | "pop" | "rise";
const depth = (p: string) => p.split("/").filter(Boolean).length;
const CLASS: Record<Dir, string> = {
  none: "",
  push: "animate-push", // went deeper: slide in from the right
  pop: "animate-pop-back", // went up a level: slide in from the left
  rise: "animate-rise", // same level (tab switch): soft fade-up
};

/**
 * iOS-style screen transitions. Animates only the page content, so the header and tab bar stay put.
 * Uses `backwards` fill so no transform lingers afterwards (a lingering transform would trap
 * position:fixed children such as bottom sheets).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [nav, setNav] = useState<{ path: string; dir: Dir }>({ path, dir: "none" });

  if (nav.path !== path) {
    const a = depth(nav.path);
    const b = depth(path);
    setNav({ path, dir: b > a ? "push" : b < a ? "pop" : "rise" });
  }

  // The window isn't the scroller any more, so reset the screen's own scroll on navigation.
  useEffect(() => {
    document.getElementById("screen-scroll")?.scrollTo({ top: 0, behavior: "instant" });
  }, [path]);

  return (
    <div key={path} className={CLASS[nav.dir]}>
      {children}
    </div>
  );
}
