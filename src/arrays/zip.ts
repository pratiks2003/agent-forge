/**
 * Combines multiple arrays element-wise into an array of tuples.
 * The output length equals the length of the shortest input array.
 *
 * @example
 * zip([1, 2, 3], ['a', 'b', 'c']); // [[1, 'a'], [2, 'b'], [3, 'c']]
 * zip([1, 2], ['a', 'b'], [true, false]); // [[1, 'a', true], [2, 'b', false]]
 *
 * @param arrays - Two or more arrays to zip together.
 * @returns An array of tuples where the i-th tuple contains the i-th element of each input array.
 * @throws {TypeError} If fewer than two arrays are provided.
 * @complexity O(n * k) where n is the length of the shortest array and k is the number of arrays
 */
export function zip<T extends unknown[][]>(
  ...arrays: { [K in keyof T]: T[K] }
): { [K in keyof T]: T[K] extends (infer U)[] ? U : never }[] {
  if (arrays.length < 2) {
    throw new TypeError(
      "zip requires at least two arrays, received " + arrays.length,
    );
  }

  const minLen = Math.min(...arrays.map((a) => a.length));
  const result: { [K in keyof T]: T[K] extends (infer U)[] ? U : never }[] = [];

  for (let i = 0; i < minLen; i++) {
    const tuple = arrays.map((a) => a[i]) as {
      [K in keyof T]: T[K] extends (infer U)[] ? U : never;
    };
    result.push(tuple);
  }

  return result;
}
