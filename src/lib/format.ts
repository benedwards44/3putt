/** Handicap index for display — negative indexes are "plus" handicaps, e.g. -2 → "+2" */
export function formatHandicap(hi: number): string {
  return hi < 0 ? `+${Math.abs(hi)}` : String(hi);
}
