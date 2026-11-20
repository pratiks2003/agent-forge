/**
 * Constrains `value` to the closed interval [min, max].
 *
 * @param value - The number to clamp.
 * @param min - The lower bound (inclusive).
 * @param max - The upper bound (inclusive).
 * @returns The clamped number.
 * @example
 * clamp(10, 0, 5); // 5
 * clamp(-3, 0, 5); // 0
 * clamp(3, 0, 5);  // 3
 * @complexity O(1)
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    throw new TypeError("clamp: value must be a finite number");
  }
  if (Number.isNaN(min)) {
    throw new TypeError("clamp: min must be a finite number");
  }
  if (Number.isNaN(max)) {
    throw new TypeError("clamp: max must be a finite number");
  }
  if (min > max) {
    throw new RangeError("clamp: min must be <= max");
  }
  return Math.min(Math.max(value, min), max);
}
