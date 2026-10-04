import { cn } from "@/lib/cn";
import { iconPaths, type IconName } from "@/components/ui/icon";
import { getStop } from "@/lib/data/stops";

export interface MapMarker {
  x: number;
  y: number;
  kind: "pin-a" | "pin-b" | "car" | "bus" | "me" | "demand";
  label?: string;
}

/** Quadratic path between two canvas points with a gentle bend, so routes feel like roads. */
export function routePath(fromId: string, toId: string) {
  const a = getStop(fromId);
  const b = getStop(toId);
  if (!a || !b) return null;
  const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.18;
  const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.18;
  return { d: `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`, a, b };
}

function Marker({ m }: { m: MapMarker }) {
  if (m.kind === "pin-a" || m.kind === "pin-b") {
    return (
      <g transform={`translate(${m.x - 18} ${m.y - 44})`}>
        <path d="M18 42S3 28 3 16a15 15 0 0130 0c0 12-15 26-15 26z" fill={m.kind === "pin-a" ? "#FFC61A" : "#0D0D0D"} stroke="#0D0D0D" strokeWidth="3" />
        {m.kind === "pin-a" ? <circle cx="18" cy="16" r="5.5" fill="#0D0D0D" /> : <rect x="12" y="10" width="12" height="12" rx="3" fill="#FFC61A" />}
      </g>
    );
  }
  if (m.kind === "me") {
    return (
      <g transform={`translate(${m.x} ${m.y})`}>
        <circle r="26" fill="#FFC61A" opacity=".28" />
        <circle r="11" fill="#0D0D0D" stroke="#fff" strokeWidth="4" />
      </g>
    );
  }
  if (m.kind === "demand") {
    return (
      <g transform={`translate(${m.x} ${m.y})`}>
        <circle r="22" fill="#FFC61A" stroke="#0D0D0D" strokeWidth="3" />
        <text textAnchor="middle" y="6" fontSize="18" fontWeight="800" fill="#0D0D0D" fontFamily="var(--font-display)">{m.label}</text>
      </g>
    );
  }
  const ic: IconName = m.kind;
  return (
    <g style={{ transform: `translate(${m.x}px, ${m.y}px)`, transition: "transform 1100ms var(--ease-in-out-strong)" }}>
      <circle r="20" cy="3" fill="#0D0D0D" />
      <circle r="20" fill="#FFC61A" stroke="#0D0D0D" strokeWidth="3" />
      <g transform="translate(-10 -10) scale(.84)" fill="none" stroke="#0D0D0D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{iconPaths[ic]}</g>
    </g>
  );
}

/** Illustrative city map: theme-aware, scalable, accessible. Not real geography. */
export function MapCanvas({ markers = [], route, className, label = "Map of the route" }: { markers?: MapMarker[]; route?: { fromId: string; toId: string } | null; className?: string; label?: string }) {
  const r = route ? routePath(route.fromId, route.toId) : null;
  return (
    <svg viewBox="0 0 390 520" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label} className={cn("block size-full", className)}>
      <rect width="390" height="520" className="fill-map-land" />
      <path d="M-10 90C80 70 120 140 220 120S360 60 410 90V-10H-10Z" className="fill-map-water" />
      <ellipse cx="310" cy="340" rx="70" ry="46" className="fill-map-park" />
      <rect x="20" y="230" width="90" height="60" rx="18" className="fill-map-park" />
      <g className="stroke-map-casing" strokeWidth="18" strokeLinecap="round" fill="none"><path d="M-10 300L400 250M120 -10L170 540M-10 430L400 470M300 -10L250 540" /></g>
      <g className="stroke-map-road" strokeWidth="13" strokeLinecap="round" fill="none"><path d="M-10 300L400 250M120 -10L170 540M-10 430L400 470M300 -10L250 540" /></g>
      <g className="stroke-map-road" strokeWidth="5" fill="none"><path d="M-10 200L400 170M40 -10L20 540M370 -10L330 540M-10 360L400 380" /></g>
      {r && (
        <>
          <path d={r.d} stroke="#FFC61A" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d={r.d} stroke="#0D0D0D" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      )}
      {r && <Marker m={{ x: r.a.x, y: r.a.y, kind: "pin-a" }} />}
      {r && <Marker m={{ x: r.b.x, y: r.b.y, kind: "pin-b" }} />}
      {markers.map((m, i) => <Marker key={i} m={m} />)}
    </svg>
  );
}
