/**
 * Splits an array into successive sub-arrays of at most `size` elements.
 * The last chunk may be smaller than `size` if the array length is not
 * evenly divisible.
 *
 * Float values that are mathematically equal to a positive integer (e.g. `2.0`)
 * are accepted; any other non-integer finite number (e.g. `1.5`) throws a
 * `RangeError`.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 * chunk(['a', 'b', 'c'], 3) // [['a', 'b', 'c']]
 * chunk([], 4)              // []
 *
 * @param array - The source array to split (never mutated). Accepts `readonly T[]`.
 * @param size  - Maximum number of elements per chunk. Must be a positive integer
 *               (floats that equal an integer, e.g. `2.0`, are silently accepted).
 * @returns A new array of chunk arrays.
 * @throws {TypeError}  If `array` is not an array.
 * @throws {RangeError} If `size` is not a finite positive integer (or integer-valued float).
 *
 * @complexity O(n) time, O(n) space where n = array.length
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (!Array.isArray(array)) {
    throw new TypeError(
      "chunk: first argument must be an array, received " + typeof array,
    );
  }

  if (
    !Number.isFinite(size) ||
    size <= 0 ||
    Math.floor(size) !== size
  ) {
    throw new RangeError(
      "chunk: size must be a finite positive integer, received " + size,
    );
  }

  const result: T[][] = [];
  const len = array.length;

  for (let i = 0; i < len; i += size) {
    result.push(array.slice(i, i + size) as T[]);
  }

  return result;
}
