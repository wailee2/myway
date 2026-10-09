import { Danfo } from "@/components/illustrations/vehicles";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-xl place-items-center gap-6 px-6 py-16 text-center">
      <Danfo className="w-64" title="A danfo that took a wrong turn" />
      <div className="space-y-2">
        <h1 className="text-display-md">This stop does not exist</h1>
        <p className="text-fg-muted">The page you wanted is not on this route. Head back to the start and pick another stop.</p>
      </div>
      <ButtonLink href="/" iconRight="arrowR">Back to MYWAY</ButtonLink>
    </main>
  );
}
