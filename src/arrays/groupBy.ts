/**
 * Groups elements of an array into a `Map` keyed by a derived value.
 *
 * @example
 * groupBy([1, 2, 3, 4], x => x % 2 === 0 ? 'even' : 'odd');
 * // Map { 'odd' => [1, 3], 'even' => [2, 4] }
 *
 * @param items - Source array (not mutated). Accepts `ReadonlyArray<T>`.
 * @param keyFn - Pure function that maps each element to a `PropertyKey` bucket key.
 * @returns A new `Map<K, T[]>` whose iteration order reflects the first-seen order
 *   of each key, with each group array preserving the original element order.
 *   O(n) time, O(n) space.
 */
export function groupBy<T, K extends PropertyKey>(
  items: ReadonlyArray<T>,
  keyFn: (item: T) => K,
): Map<K, T[]> {
  if (typeof keyFn !== "function") {
    throw new TypeError(
      "groupBy: keyFn must be a function, received " + typeof keyFn,
    );
  }

  const map = new Map<K, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket === undefined) {
      map.set(key, [item]);
    } else {
      bucket.push(item);
    }
  }

  return map;
}
