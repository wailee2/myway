/** Straight-line distance in metres between two coordinates (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "300 m" or "1.2 km". Rounds to the nearest 50 m under a kilometre so we never imply false precision. */
export function formatDistance(m: number) {
  if (m < 1000) return `${Math.max(50, Math.round(m / 50) * 50)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/** Minutes to walk a distance at a relaxed pace (about 80 m a minute). */
export const walkMinutes = (m: number) => Math.max(1, Math.round(m / 80));
