import { describe, expect, it } from "vitest";
import { lerp } from "../src/math/lerp";

describe("lerp", () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("returns midpoint for t=0.5 between 0 and 10", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("returns a exactly when t=0", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(-99, 42, 0)).toBe(-99);
  });

  it("returns b exactly when t=1", () => {
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(-99, 42, 1)).toBe(42);
  });

  it("works with negative boundaries: lerp(-10, 10, 0.5) === 0", () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it("works when a > b: lerp(10, 0, 0.25) === 7.5", () => {
    expect(lerp(10, 0, 0.25)).toBe(7.5);
  });

  it("works with floating-point boundaries (tolerance)", () => {
    expect(lerp(0.1, 0.9, 0.5)).toBeCloseTo(0.5, 10);
  });

  it("returns a when a === b regardless of t", () => {
    expect(lerp(5, 5, 0)).toBe(5);
    expect(lerp(5, 5, 0.5)).toBe(5);
    expect(lerp(5, 5, 1)).toBe(5);
    expect(lerp(5, 5, 2)).toBe(5);
  });

  // ---------------------------------------------------------------------------
  // Extrapolation (t outside [0, 1]) — must NOT throw
  // ---------------------------------------------------------------------------

  it("extrapolates beyond b when t > 1", () => {
    expect(lerp(0, 10, 1.5)).toBe(15);
  });

  it("extrapolates before a when t < 0", () => {
    expect(lerp(0, 10, -0.5)).toBe(-5);
  });

  it("does not throw for t outside [0, 1]", () => {
    expect(() => lerp(0, 10, 2)).not.toThrow();
    expect(() => lerp(0, 10, -1)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // Large numbers
  // ---------------------------------------------------------------------------

  it("produces a finite result for very large safe integers", () => {
    const result = lerp(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1, 0.5);
    expect(Number.isFinite(result)).toBe(true);
  });

  it("returns finite result for negative large values", () => {
    const result = lerp(-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0.5);
    expect(Number.isFinite(result)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // NaN — must throw TypeError
  // ---------------------------------------------------------------------------

  it("throws TypeError when a is NaN", () => {
    expect(() => lerp(NaN, 10, 0.5)).toThrowError(
      new TypeError("lerp: argument `a` must be a finite number, received NaN")
    );
  });

  it("throws TypeError when b is NaN", () => {
    expect(() => lerp(0, NaN, 0.5)).toThrowError(
      new TypeError("lerp: argument `b` must be a finite number, received NaN")
    );
  });

  it("throws TypeError when t is NaN", () => {
    expect(() => lerp(0, 10, NaN)).toThrowError(
      new TypeError("lerp: argument `t` must be a finite number, received NaN")
    );
  });

  // ---------------------------------------------------------------------------
  // Infinity — must throw TypeError
  // ---------------------------------------------------------------------------

  it("throws TypeError when a is Infinity", () => {
    expect(() => lerp(Infinity, 10, 0.5)).toThrowError(TypeError);
    expect(() => lerp(Infinity, 10, 0.5)).toThrowError("`a`");
  });

  it("throws TypeError when a is -Infinity", () => {
    expect(() => lerp(-Infinity, 10, 0.5)).toThrowError(TypeError);
  });

  it("throws TypeError when b is Infinity", () => {
    expect(() => lerp(0, Infinity, 0.5)).toThrowError(TypeError);
    expect(() => lerp(0, Infinity, 0.5)).toThrowError("`b`");
  });

  it("throws TypeError when b is -Infinity", () => {
    expect(() => lerp(0, -Infinity, 0.5)).toThrowError(TypeError);
  });

  it("throws TypeError when t is Infinity", () => {
    expect(() => lerp(0, 10, Infinity)).toThrowError(TypeError);
    expect(() => lerp(0, 10, Infinity)).toThrowError("`t`");
  });

  it("throws TypeError when t is -Infinity", () => {
    expect(() => lerp(0, 10, -Infinity)).toThrowError(TypeError);
  });

  // ---------------------------------------------------------------------------
  // Immutability — primitives are immutable but we document the contract
  // ---------------------------------------------------------------------------

  it("does not mutate its arguments (immutability contract)", () => {
    const a = 3;
    const b = 7;
    const t = 0.25;
    lerp(a, b, t);
    expect(a).toBe(3);
    expect(b).toBe(7);
    expect(t).toBe(0.25);
  });

  // ---------------------------------------------------------------------------
  // Specific numeric precision checks
  // ---------------------------------------------------------------------------

  it("lerp(0, 1, 0.1) is close to 0.1", () => {
    expect(lerp(0, 1, 0.1)).toBeCloseTo(0.1, 15);
  });

  it("lerp(0, 100, 0.33) is close to 33", () => {
    expect(lerp(0, 100, 0.33)).toBeCloseTo(33, 10);
  });
});
