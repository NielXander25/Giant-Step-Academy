import type { TieMethod } from "./rules";

/**
 * Class positions from averages. Students with the same average share a position.
 * Standard: 1, 2, 2, 4.  Dense: 1, 2, 2, 3.
 */
export function assignPositions(items: { id: string; average: number }[], method: TieMethod): Map<string, number> {
  const sorted = [...items].sort((a, b) => b.average - a.average);
  const positions = new Map<string, number>();

  let position = 0;
  let previous: number | null = null;
  sorted.forEach((item, index) => {
    if (previous === null || item.average !== previous) {
      position = method === "DENSE" ? position + 1 : index + 1;
      previous = item.average;
    }
    positions.set(item.id, position);
  });
  return positions;
}
