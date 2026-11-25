/**
 * Linearly interpolates between two numbers.
 *
 * The factor `t` is not clamped to `[0, 1]`; values outside that range
 * produce valid extrapolated results (e.g. useful for easing overshoots).
 *
 * @param a - Start value.
 * @param b - End value.
 * @param t - Interpolation factor, expected in [0, 1]. Values outside this
 *   range are allowed and will extrapolate beyond `a` and `b`.
 * @returns The value at position `t` between `a` and `b`.
 * @example
 * lerp(0, 10, 0.5); // 5
 * lerp(0, 10, 0);   // 0
 * lerp(0, 10, 1);   // 10
 * lerp(-10, 10, 0.5); // 0
 * lerp(0, 10, 1.5);   // 15  (extrapolation)
 * @complexity O(1)
 */
export function lerp(a: number, b: number, t: number): number {
  if (Number.isNaN(a)) {
    throw new TypeError("lerp: argument `a` must be a finite number, received NaN");
  }
  if (Number.isNaN(b)) {
    throw new TypeError("lerp: argument `b` must be a finite number, received NaN");
  }
  if (Number.isNaN(t)) {
    throw new TypeError("lerp: argument `t` must be a finite number, received NaN");
  }
  if (!Number.isFinite(a)) {
    throw new TypeError(
      `lerp: argument \`a\` must be a finite number, received ${a}`
    );
  }
  if (!Number.isFinite(b)) {
    throw new TypeError(
      `lerp: argument \`b\` must be a finite number, received ${b}`
    );
  }
  if (!Number.isFinite(t)) {
    throw new TypeError(
      `lerp: argument \`t\` must be a finite number, received ${t}`
    );
  }

  // Use the numerically stable form: a + t * (b - a)
  // This guarantees lerp(a, b, 0) === a and lerp(a, b, 1) === b exactly
  // when b - a is representable, though for t=1 we special-case to avoid
  // floating-point drift.
  if (t === 0) return a;
  if (t === 1) return b;

  return a + t * (b - a);
}
