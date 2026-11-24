/**
 * Maps each element of an array through `fn` and flattens the resulting
 * arrays one level deep, returning a new array.
 *
 * @param arr - The source array.
 * @param fn - A function that returns an array for each element.
 * @returns A new flat array of all results concatenated.
 * @example
 * flatMap([1, 2, 3], n => [n, n * 2]); // [1, 2, 2, 4, 3, 6]
 * flatMap(['a,b', 'c'], s => s.split(',')); // ['a', 'b', 'c']
 * @complexity O(n * m) where n = arr.length and m = average inner-array length
 */
export function flatMap<T, U>(
  arr: readonly T[],
  fn: (item: T, index: number, array: readonly T[]) => readonly U[],
): U[] {
  if (!Array.isArray(arr)) {
    throw new TypeError("flatMap: first argument must be an array");
  }
  if (typeof fn !== "function") {
    throw new TypeError("flatMap: second argument must be a function");
  }

  const result: U[] = [];
  const len = arr.length;

  for (let i = 0; i < len; i++) {
    const inner = fn(arr[i] as T, i, arr);
    for (let j = 0; j < inner.length; j++) {
      result.push(inner[j] as U);
    }
  }

  return result;
}
