"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-xl place-items-center gap-4 px-6 text-center">
      <h1 className="text-display-md">Something broke on the road</h1>
      <p className="text-fg-muted">Your booking data is safe. Try again, and if it keeps happening, refresh the page.</p>
      <Button onClick={reset} icon="history">Try again</Button>
    </main>
  );
}
