import { describe, expect, it } from "vitest";
import { chunk } from "../src/arrays/chunk";

describe("chunk", () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("splits an array into chunks of the given size (odd remainder)", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("splits an array into equal chunks when evenly divisible", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("returns a single chunk when size equals array length", () => {
    expect(chunk(["a", "b", "c"], 3)).toEqual([["a", "b", "c"]]);
  });

  it("returns a single chunk when size is larger than array length", () => {
    expect(chunk([42], 10)).toEqual([[42]]);
  });

  it("returns an empty array for an empty input", () => {
    expect(chunk([], 5)).toEqual([]);
  });

  it("produces single-element chunks when size === 1", () => {
    const input = [10, 20, 30];
    const result = chunk(input, 1);
    expect(result).toEqual([[10], [20], [30]]);
    expect(result).toHaveLength(input.length);
  });

  // ---------------------------------------------------------------------------
  // Generic types
  // ---------------------------------------------------------------------------

  it("works with string arrays", () => {
    expect(chunk(["x", "y", "z"], 2)).toEqual([["x", "y"], ["z"]]);
  });

  it("works with object arrays and preserves references", () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const c = { id: 3 };
    const result = chunk([a, b, c], 2);
    expect(result[0]?.[0]).toBe(a);
    expect(result[0]?.[1]).toBe(b);
    expect(result[1]?.[0]).toBe(c);
  });

  it("works with undefined elements", () => {
    expect(chunk([undefined, undefined, undefined], 2)).toEqual([
      [undefined, undefined],
      [undefined],
    ]);
  });

  // ---------------------------------------------------------------------------
  // Readonly inputs (compile-time check via as const)
  // ---------------------------------------------------------------------------

  it("accepts readonly arrays (as const)", () => {
    const input = [1, 2, 3, 4] as const;
    expect(chunk(input, 2)).toEqual([[1, 2], [3, 4]]);
  });

  // ---------------------------------------------------------------------------
  // Immutability
  // ---------------------------------------------------------------------------

  it("does not mutate the original array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    chunk(input, 2);
    expect(input).toEqual(copy);
  });

  it("mutating a returned chunk does not affect other chunks", () => {
    const result = chunk([1, 2, 3, 4], 2);
    // Push into first chunk
    result[0]?.push(99);
    expect(result[1]).toEqual([3, 4]);
  });

  // ---------------------------------------------------------------------------
  // Float size that equals an integer
  // ---------------------------------------------------------------------------

  it("accepts a float that is mathematically equal to a positive integer (2.0)", () => {
    expect(chunk([1, 2, 3, 4], 2.0)).toEqual([[1, 2], [3, 4]]);
  });

  // ---------------------------------------------------------------------------
  // Invalid size — RangeError
  // ---------------------------------------------------------------------------

  it("throws RangeError when size is 0", () => {
    expect(() => chunk([1, 2], 0)).toThrowError(RangeError);
  });

  it("throws RangeError when size is negative", () => {
    expect(() => chunk([1, 2], -1)).toThrowError(RangeError);
  });

  it("throws RangeError when size is a non-integer finite number (1.5)", () => {
    expect(() => chunk([1, 2], 1.5)).toThrowError(RangeError);
  });

  it("throws RangeError when size is Infinity", () => {
    expect(() => chunk([1, 2], Infinity)).toThrowError(RangeError);
  });

  it("throws RangeError when size is NaN", () => {
    expect(() => chunk([1, 2], NaN)).toThrowError(RangeError);
  });

  // ---------------------------------------------------------------------------
  // Invalid array — TypeError
  // ---------------------------------------------------------------------------

  it("throws TypeError when first argument is not an array (string)", () => {
    expect(() => chunk("hello" as unknown as never[], 2)).toThrowError(TypeError);
  });

  it("throws TypeError when first argument is null", () => {
    expect(() => chunk(null as unknown as never[], 2)).toThrowError(TypeError);
  });

  it("throws TypeError when first argument is an object", () => {
    expect(() => chunk({} as unknown as never[], 2)).toThrowError(TypeError);
  });

  // ---------------------------------------------------------------------------
  // Large array (no stack overflow)
  // ---------------------------------------------------------------------------

  it("handles a 100,000-element array with size 1 without stack overflow", () => {
    const big = Array.from({ length: 100_000 }, (_, i) => i);
    const result = chunk(big, 1);
    expect(result).toHaveLength(100_000);
    expect(result[0]).toEqual([0]);
    expect(result[99_999]).toEqual([99_999]);
  });
});
