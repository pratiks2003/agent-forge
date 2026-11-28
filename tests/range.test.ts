import { describe, expect, it } from "vitest";
import { range } from "../src/math/range";

describe("range", () => {
  // ---------------------------------------------------------------------------
  // Happy path — ascending
  // ---------------------------------------------------------------------------

  it("range(0, 5) returns [0, 1, 2, 3, 4]", () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("range(1, 6) returns [1, 2, 3, 4, 5]", () => {
    expect(range(1, 6)).toEqual([1, 2, 3, 4, 5]);
  });

  it("range(0, 10, 2) returns [0, 2, 4, 6, 8]", () => {
    expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
  });

  it("range(0, 1) returns [0] (single-element ascending)", () => {
    expect(range(0, 1)).toEqual([0]);
  });

  // ---------------------------------------------------------------------------
  // Happy path — descending
  // ---------------------------------------------------------------------------

  it("range(5, 0) returns [5, 4, 3, 2, 1] (auto negative step)", () => {
    expect(range(5, 0)).toEqual([5, 4, 3, 2, 1]);
  });

  it("range(10, 0, -2) returns [10, 8, 6, 4, 2]", () => {
    expect(range(10, 0, -2)).toEqual([10, 8, 6, 4, 2]);
  });

  it("range(1, 0) returns [1] (single-element descending)", () => {
    expect(range(1, 0)).toEqual([1]);
  });

  // ---------------------------------------------------------------------------
  // Empty result
  // ---------------------------------------------------------------------------

  it("range(3, 3) returns [] (start equals end)", () => {
    expect(range(3, 3)).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Floating-point step
  // ---------------------------------------------------------------------------

  it("range(0, 0.5, 0.1) returns approximately [0, 0.1, 0.2, 0.3, 0.4]", () => {
    const result = range(0, 0.5, 0.1);
    expect(result).toHaveLength(5);
    const expected = [0, 0.1, 0.2, 0.3, 0.4];
    result.forEach((val, i) => {
      expect(val).toBeCloseTo(expected[i] as number, 10);
    });
  });

  it("range(0, 1, 0.25) returns [0, 0.25, 0.5, 0.75]", () => {
    const result = range(0, 1, 0.25);
    expect(result).toHaveLength(4);
    [0, 0.25, 0.5, 0.75].forEach((val, i) => {
      expect(result[i]).toBeCloseTo(val, 10);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("range(-3, 2) returns [-3, -2, -1, 0, 1] (negative start)", () => {
    expect(range(-3, 2)).toEqual([-3, -2, -1, 0, 1]);
  });

  it("range(-1, -5, -1) returns [-1, -2, -3, -4]", () => {
    expect(range(-1, -5, -1)).toEqual([-1, -2, -3, -4]);
  });

  it("range(0, 10, 3) returns [0, 3, 6, 9] (step does not divide evenly)", () => {
    expect(range(0, 10, 3)).toEqual([0, 3, 6, 9]);
  });

  it("produces a large range without off-by-one errors", () => {
    const result = range(0, 1000);
    expect(result).toHaveLength(1000);
    expect(result[0]).toBe(0);
    expect(result[999]).toBe(999);
  });

  // ---------------------------------------------------------------------------
  // Error cases — TypeError (non-finite inputs)
  // ---------------------------------------------------------------------------

  it("throws TypeError when start is NaN", () => {
    expect(() => range(NaN, 5)).toThrowError(TypeError);
    expect(() => range(NaN, 5)).toThrow("start");
  });

  it("throws TypeError when end is Infinity", () => {
    expect(() => range(0, Infinity)).toThrowError(TypeError);
    expect(() => range(0, Infinity)).toThrow("end");
  });

  it("throws TypeError when end is -Infinity", () => {
    expect(() => range(0, -Infinity)).toThrowError(TypeError);
  });

  it("throws TypeError when step is NaN", () => {
    expect(() => range(0, 5, NaN)).toThrowError(TypeError);
    expect(() => range(0, 5, NaN)).toThrow("step");
  });

  it("throws TypeError when step is Infinity", () => {
    expect(() => range(0, 5, Infinity)).toThrowError(TypeError);
  });

  // ---------------------------------------------------------------------------
  // Error cases — RangeError (invalid step value or direction)
  // ---------------------------------------------------------------------------

  it("throws RangeError with clear message when step is 0", () => {
    expect(() => range(0, 5, 0)).toThrowError(RangeError);
    expect(() => range(0, 5, 0)).toThrow("step must not be 0");
  });

  it("throws RangeError when step is positive but start > end", () => {
    expect(() => range(5, 0, 1)).toThrowError(RangeError);
    expect(() => range(5, 0, 1)).toThrow("negative");
  });

  it("throws RangeError when step is negative but start < end", () => {
    expect(() => range(0, 5, -1)).toThrowError(RangeError);
    expect(() => range(0, 5, -1)).toThrow("positive");
  });

  // ---------------------------------------------------------------------------
  // Immutability — primitives, trivially guaranteed, but verify no side-effects
  // ---------------------------------------------------------------------------

  it("does not modify its arguments (primitives — reference check)", () => {
    const s = 0;
    const e = 5;
    const st = 1;
    range(s, e, st);
    expect(s).toBe(0);
    expect(e).toBe(5);
    expect(st).toBe(1);
  });

  it("returns a fresh array on each call", () => {
    const a = range(0, 3);
    const b = range(0, 3);
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
