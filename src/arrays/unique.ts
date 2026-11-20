/**
 * Returns the distinct items of an array, preserving first-seen order.
 *
 * @example unique([3, 1, 3, 2, 1]) // [3, 1, 2]
 * @param items - Source array (not mutated).
 * @param key - Optional projection used to decide equality.
 * @returns A new array without duplicates. O(n) time, O(n) space.
 */
export function unique<T, K = T>(items: readonly T[], key?: (item: T) => K): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];
  for (const item of items) {
    const k = key ? key(item) : item;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}
