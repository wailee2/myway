import { cn } from "@/lib/cn";
import { iconPaths, type IconName } from "@/components/ui/icon";
import { getStop } from "@/lib/data/stops";

export interface MapMarker {
  x: number;
  y: number;
  kind: "pin-a" | "pin-b" | "car" | "bus" | "me" | "demand";
  label?: string;
}

/** Smooth road-like path through one or more stops (two stops = a gentle bend, more = quadratic smoothing). */
export function routePath(stopIds: string[]) {
  const pts = stopIds.map((id) => getStop(id)).filter((s): s is NonNullable<ReturnType<typeof getStop>> => Boolean(s));
  if (pts.length < 2) return null;
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  let d: string;
  if (pts.length === 2) {
    const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.18;
    const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.18;
    d = `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`;
  } else {
    d = `M${a.x} ${a.y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const c = pts[i]!;
      const n = pts[i + 1]!;
      d += ` Q${c.x} ${c.y} ${i === pts.length - 2 ? n.x : (c.x + n.x) / 2} ${i === pts.length - 2 ? n.y : (c.y + n.y) / 2}`;
    }
  }
  return { d, a, b, pts };
}

const CANVAS = { w: 390, h: 520 };

/**
 * The viewBox is computed from what is actually on the map (route, stops, markers, pin heights), so a pin
 * or stop is never clipped. Falls back to the whole canvas when there is nothing to frame.
 */
export function frameFor(points: { x: number; y: number; top?: number; r?: number }[]) {
  if (!points.length) return { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    const r = p.r ?? 24;
    minX = Math.min(minX, p.x - r); maxX = Math.max(maxX, p.x + r);
    minY = Math.min(minY, p.y - r - (p.top ?? 0)); maxY = Math.max(maxY, p.y + r);
  }
  const pad = 30;
  const ar = CANVAS.w / CANVAS.h;
  let w = Math.max(maxX - minX + pad * 2, (maxY - minY + pad * 2) * ar, 230);
  let h = w / ar;
  if (w >= CANVAS.w || h >= CANVAS.h) return { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h };
  const x = Math.min(Math.max((minX + maxX) / 2 - w / 2, 0), CANVAS.w - w);
  const y = Math.min(Math.max((minY + maxY) / 2 - h / 2, 0), CANVAS.h - h);
  w = Math.round(w); h = Math.round(h);
  return { x: Math.round(x), y: Math.round(y), w, h };
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
export function MapCanvas({ markers = [], route, className, label = "Map of the route" }: {
  markers?: MapMarker[];
  /** Highlight a journey. `via` lists every stop on the way (drawn as small dots). */
  route?: { fromId: string; toId: string; via?: string[] } | null;
  className?: string;
  label?: string;
}) {
  const r = route ? routePath(route.via && route.via.length > 1 ? route.via : [route.fromId, route.toId]) : null;
  const points = [
    ...(r ? r.pts.map((p) => ({ x: p.x, y: p.y, r: 8 })) : []),
    ...(r ? [{ x: r.a.x, y: r.a.y, top: 44, r: 18 }, { x: r.b.x, y: r.b.y, top: 44, r: 18 }] : []),
    ...markers.map((m) => ({ x: m.x, y: m.y, top: m.kind === "pin-a" || m.kind === "pin-b" ? 44 : 0, r: m.kind === "me" ? 28 : 24 })),
  ];
  const f = frameFor(points);
  return (
    <svg viewBox={`${f.x} ${f.y} ${f.w} ${f.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label} className={cn("block size-full", className)}>
      <rect x="-800" y="-800" width="2000" height="2200" className="fill-map-land" />
      <rect x="-800" y="-800" width="2000" height="790" className="fill-map-water" />
      <path d="M-10 90C80 70 120 140 220 120S360 60 410 90V-10H-10Z" className="fill-map-water" />
      <ellipse cx="310" cy="340" rx="70" ry="46" className="fill-map-park" />
      <rect x="20" y="230" width="90" height="60" rx="18" className="fill-map-park" />
      <g className="stroke-map-casing" strokeWidth="18" strokeLinecap="round" fill="none"><path d="M-600 372L1000 177M64 -600L221 1100M-600 372L1000 529M354 -600L199 1100" /></g>
      <g className="stroke-map-road" strokeWidth="13" strokeLinecap="round" fill="none"><path d="M-600 372L1000 177M64 -600L221 1100M-600 372L1000 529M354 -600L199 1100" /></g>
      <g className="stroke-map-road" strokeWidth="5" fill="none"><path d="M-600 243L1000 126M61 -600L0 1100M413 -600L289 1100M-600 331L1000 409" /></g>
      {r && (
        <>
          <path d={r.d} stroke="#FFC61A" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={r.d} stroke="#0D0D0D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {r.pts.slice(1, -1).map((p) => <circle key={p.id} cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#0D0D0D" strokeWidth="3" />)}
        </>
      )}
      {r && <Marker m={{ x: r.a.x, y: r.a.y, kind: "pin-a" }} />}
      {r && <Marker m={{ x: r.b.x, y: r.b.y, kind: "pin-b" }} />}
      {markers.map((m, i) => <Marker key={i} m={m} />)}
    </svg>
  );
}
