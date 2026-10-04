import { cn } from "@/lib/cn";

interface IllProps {
  className?: string;
  title?: string;
}

/** The danfo: the brand's hero illustration. `spin` makes the wheels roll. */
export function Danfo({ className, title = "A yellow danfo bus with a black stripe", spin }: IllProps & { spin?: boolean }) {
  const wheel = (cx: number) => (
    <g>
      <circle cx={cx} cy="152" r="26" fill="#0D0D0D" />
      <g className={cn("origin-center", spin && "motion-safe:animate-spin-wheel")} style={{ transformOrigin: `${cx}px 152px` }}>
        <circle cx={cx} cy="152" r="10" fill="#FFC61A" stroke="#0D0D0D" strokeWidth="3" />
        <path d={`M${cx} 143v18M${cx - 9} 152h18`} stroke="#0D0D0D" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
  return (
    <svg viewBox="0 0 320 190" fill="none" role="img" aria-label={title} className={className}>
      <rect x="46" y="20" width="200" height="9" rx="4" fill="#0D0D0D" />
      <rect x="60" y="4" width="46" height="18" rx="5" fill="#fff" stroke="#0D0D0D" strokeWidth="3" />
      <rect x="118" y="8" width="34" height="14" rx="4" fill="#E5484D" stroke="#0D0D0D" strokeWidth="3" />
      <rect x="6" y="30" width="308" height="120" rx="22" fill="#FFC61A" stroke="#0D0D0D" strokeWidth="5" />
      <rect x="8" y="92" width="304" height="22" fill="#0D0D0D" />
      <path d="M22 97l6 6-6 6M34 97l6 6-6 6M46 97l6 6-6 6" stroke="#FFC61A" strokeWidth="3" strokeLinecap="round" />
      <g fill="#FFF7D6" stroke="#0D0D0D" strokeWidth="4">
        <rect x="22" y="44" width="54" height="40" rx="8" />
        <rect x="84" y="44" width="54" height="40" rx="8" />
        <rect x="146" y="44" width="54" height="40" rx="8" />
        <path d="M212 44h50l30 12c6 2 10 8 10 14v14h-90z" />
      </g>
      <circle cx="296" cy="128" r="8" fill="#fff" stroke="#0D0D0D" strokeWidth="3" />
      <rect x="256" y="124" width="24" height="6" rx="3" fill="#0D0D0D" />
      {wheel(82)}
      {wheel(240)}
    </svg>
  );
}

export function CarArt({ className, title = "A white shared car with a yellow stripe", spin }: IllProps & { spin?: boolean }) {
  const wheel = (cx: number) => (
    <g>
      <circle cx={cx} cy="106" r="21" fill="#0D0D0D" />
      <circle cx={cx} cy="106" r="8" fill="#fff" className={cn(spin && "motion-safe:animate-spin-wheel")} style={{ transformOrigin: `${cx}px 106px` }} />
    </g>
  );
  return (
    <svg viewBox="0 0 320 130" fill="none" role="img" aria-label={title} className={className}>
      <path d="M12 104V88c0-8 5-13 13-15l34-8 24-28c4-5 9-7 15-7h68c7 0 13 3 18 8l26 27 70 8c10 2 16 8 16 17v14z" fill="#fff" stroke="#0D0D0D" strokeWidth="5" strokeLinejoin="round" />
      <path d="M96 36h38v27H72z" fill="#CFE3EA" stroke="#0D0D0D" strokeWidth="4" strokeLinejoin="round" />
      <path d="M144 36h24c5 0 9 2 12 5l17 22h-53z" fill="#CFE3EA" stroke="#0D0D0D" strokeWidth="4" strokeLinejoin="round" />
      <rect x="14" y="84" width="284" height="9" fill="#FFC61A" />
      {wheel(76)}
      {wheel(238)}
    </svg>
  );
}

/** Top-down car: four passenger seats + driver. The core promise of the product. */
export function SeatsArt({ className, title = "Top view of a car with four passenger seats and the driver seat" }: IllProps) {
  return (
    <svg viewBox="0 0 260 300" fill="none" role="img" aria-label={title} className={className}>
      <rect x="40" y="10" width="180" height="280" rx="52" fill="#fff" stroke="#0D0D0D" strokeWidth="5" />
      <path d="M62 48c20-14 116-14 136 0" stroke="#0D0D0D" strokeWidth="5" strokeLinecap="round" />
      <g stroke="#0D0D0D" strokeWidth="4">
        <rect x="62" y="78" width="60" height="66" rx="16" fill="#0D0D0D" />
        <rect x="138" y="78" width="60" height="66" rx="16" fill="#FFC61A" />
        <rect x="58" y="176" width="52" height="66" rx="16" fill="#FFC61A" />
        <rect x="104" y="176" width="52" height="66" rx="16" fill="#FFC61A" />
        <rect x="150" y="176" width="52" height="66" rx="16" fill="#FFC61A" />
      </g>
      <g fill="#fff" stroke="#0D0D0D" strokeWidth="3">
        <circle cx="168" cy="102" r="10" /><circle cx="84" cy="200" r="10" /><circle cx="130" cy="200" r="10" /><circle cx="176" cy="200" r="10" />
      </g>
    </svg>
  );
}

export function PayArt({ className, title = "Naira notes, a wallet and a coin" }: IllProps) {
  return (
    <svg viewBox="0 0 320 220" fill="none" role="img" aria-label={title} className={className}>
      <g transform="rotate(-8 150 110)">
        <rect x="36" y="46" width="210" height="116" rx="14" fill="#0A8F4E" stroke="#0D0D0D" strokeWidth="5" />
        <circle cx="141" cy="104" r="32" fill="#DDF4E7" stroke="#0D0D0D" strokeWidth="4" />
        <path d="M56 66h28M198 142h28" stroke="#0D0D0D" strokeWidth="5" strokeLinecap="round" />
      </g>
      <rect x="70" y="118" width="190" height="84" rx="16" fill="#0D0D0D" />
      <rect x="216" y="142" width="62" height="36" rx="14" fill="#FFC61A" stroke="#0D0D0D" strokeWidth="4" />
      <circle cx="238" cy="160" r="5" fill="#0D0D0D" />
      <circle cx="268" cy="70" r="30" fill="#FFC61A" stroke="#0D0D0D" strokeWidth="5" />
      <circle cx="268" cy="70" r="16" stroke="#0D0D0D" strokeWidth="4" />
    </svg>
  );
}

export function ShieldArt({ className, title = "A shield with a check mark" }: IllProps) {
  return (
    <svg viewBox="0 0 220 240" fill="none" role="img" aria-label={title} className={className}>
      <path d="M110 10l90 32v72c0 62-40 98-90 116C60 212 20 176 20 114V42z" fill="#FFC61A" stroke="#0D0D0D" strokeWidth="6" strokeLinejoin="round" />
      <path d="M110 34l66 24v56c0 46-28 74-66 90-38-16-66-44-66-90V58z" fill="#0D0D0D" />
      <path d="M78 120l24 24 42-48" stroke="#FFC61A" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
