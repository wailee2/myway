/** Deterministic pseudo-QR (visual stand-in for the MVP; swap for a real encoder later). */
export function QrCode({ seed = 7, size = 25, cell = 6, label = "Ticket QR code" }: { seed?: number; size?: number; cell?: number; label?: string }) {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const finder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
      let on: boolean;
      if (finder) {
        const lx = x < 7 ? x : x - (size - 7);
        const ly = y < 7 ? y : y - (size - 7);
        on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
      } else on = rnd() > 0.5;
      if (on) d += `M${x * cell} ${y * cell}h${cell}v${cell}h-${cell}z`;
    }
  }
  const px = size * cell;
  return (
    <svg viewBox={`0 0 ${px} ${px}`} role="img" aria-label={label} className="h-auto w-full max-w-[11rem]">
      <rect width={px} height={px} fill="#fff" />
      <path d={d} fill="#0D0D0D" />
    </svg>
  );
}
