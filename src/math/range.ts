/**
 * Generates a sequence of numbers from `start` (inclusive) up to but not
 * including `end`, advancing by `step`.
 *
 * - `step` defaults to `1` when `start < end` and `-1` when `start > end`.
 * - Returns an empty array when `start === end`.
 * - Uses index-based arithmetic (`start + index * step`) to avoid cumulative
 *   floating-point drift.
 *
 * @example
 * range(0, 5)        // [0, 1, 2, 3, 4]
 * range(5, 0)        // [5, 4, 3, 2, 1]
 * range(0, 10, 2)    // [0, 2, 4, 6, 8]
 * range(10, 0, -2)   // [10, 8, 6, 4, 2]
 * range(3, 3)        // []
 * range(0, 1, 0.25)  // [0, 0.25, 0.5, 0.75]
 *
 * @param start - The first value in the sequence (inclusive).
 * @param end   - The upper/lower bound of the sequence (exclusive).
 * @param step  - The increment between consecutive values. Defaults to `1`
 *                when ascending and `-1` when descending. Must not be `0`.
 * @returns A new array of numbers from `start` toward `end` by `step`.
 * @throws {TypeError}   If any argument is not a finite number (NaN, ±Infinity).
 * @throws {RangeError}  If `step` is `0`.
 * @throws {RangeError}  If the sign of `step` conflicts with the direction
 *                       implied by `start` and `end`.
 *
 * @complexity O(n) time and space, where n is the number of elements produced.
 */
export function range(start: number, end: number, step?: number): number[] {
  if (!Number.isFinite(start)) {
    throw new TypeError(
      `range: start must be a finite number, received ${start}`,
    );
  }
  if (!Number.isFinite(end)) {
    throw new TypeError(
      `range: end must be a finite number, received ${end}`,
    );
  }

  // Resolve default step before validating it so we can give clear messages.
  const resolvedStep: number =
    step === undefined ? (start <= end ? 1 : -1) : step;

  if (!Number.isFinite(resolvedStep)) {
    throw new TypeError(
      `range: step must be a finite number, received ${resolvedStep}`,
    );
  }

  if (resolvedStep === 0) {
    throw new RangeError("range: step must not be 0");
  }

  if (start < end && resolvedStep < 0) {
    throw new RangeError(
      `range: step must be positive when start (${start}) < end (${end}), received ${resolvedStep}`,
    );
  }

  if (start > end && resolvedStep > 0) {
    throw new RangeError(
      `range: step must be negative when start (${start}) > end (${end}), received ${resolvedStep}`,
    );
  }

  if (start === end) {
    return [];
  }

  const result: number[] = [];
  const ascending = resolvedStep > 0;
  let index = 0;

  while (true) {
    const value = start + index * resolvedStep;
    if (ascending ? value >= end : value <= end) {
      break;
    }
    result.push(value);
    index++;
  }

  return result;
}
