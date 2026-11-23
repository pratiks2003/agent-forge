import { describe, expect, it } from "vitest";
import { zip } from "../src/arrays/zip";

describe("zip", () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("zips two arrays of equal length", () => {
    expect(zip([1, 2, 3], ["a", "b", "c"])).toEqual([
      [1, "a"],
      [2, "b"],
      [3, "c"],
    ]);
  });

  it("zips three arrays of equal length", () => {
    expect(zip([1, 2], ["a", "b"], [true, false])).toEqual([
      [1, "a", true],
      [2, "b", false],
    ]);
  });

  it("truncates to the shortest array (first is shorter)", () => {
    expect(zip([1, 2], ["a", "b", "c", "d"])).toEqual([
      [1, "a"],
      [2, "b"],
    ]);
  });

  it("truncates to the shortest array (second is shorter)", () => {
    expect(zip([1, 2, 3, 4, 5], [9])).toEqual([[1, 9]]);
  });

  it("truncates to the shortest array (middle is shortest)", () => {
    expect(zip([1, 2, 3], ["a"], [true, false, false])).toEqual([[1, "a", true]]);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("returns [] when any input array is empty", () => {
    expect(zip([], [1, 2, 3])).toEqual([]);
    expect(zip([1, 2, 3], [])).toEqual([]);
    expect(zip([], [])).toEqual([]);
  });

  it("handles single-element arrays", () => {
    expect(zip([42], ["x"])).toEqual([[42, "x"]]);
  });

  it("passes through object elements without cloning", () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const result = zip([a], [b]);
    expect(result[0]?.[0]).toBe(a);
    expect(result[0]?.[1]).toBe(b);
  });

  it("passes through array elements without cloning", () => {
    const inner = [1, 2, 3];
    const result = zip([inner], [["x"]]);
    expect(result[0]?.[0]).toBe(inner);
  });

  it("handles arrays of mixed types", () => {
    expect(zip([1, 2], ["a", "b"], [null, undefined])).toEqual([
      [1, "a", null],
      [2, "b", undefined],
    ]);
  });

  // ---------------------------------------------------------------------------
  // Immutability
  // ---------------------------------------------------------------------------

  it("does not mutate the input arrays", () => {
    const a = [1, 2, 3];
    const b = ["a", "b", "c"];
    const copyA = [...a];
    const copyB = [...b];
    zip(a, b);
    expect(a).toEqual(copyA);
    expect(b).toEqual(copyB);
  });

  it("mutating output tuples does not affect inputs", () => {
    const a = [1, 2];
    const b = ["x", "y"];
    const result = zip(a, b);
    (result[0] as unknown[]).push(999);
    expect(a).toEqual([1, 2]);
    expect(b).toEqual(["x", "y"]);
  });

  // ---------------------------------------------------------------------------
  // Error cases
  // ---------------------------------------------------------------------------

  it("throws TypeError when called with zero arguments", () => {
    expect(() => (zip as (...args: unknown[][]) => unknown)()
    ).toThrowError(TypeError);
  });

  it("throws TypeError when called with one array", () => {
    expect(() => (zip as (...args: unknown[][]) => unknown)([1, 2, 3])
    ).toThrowError(TypeError);
  });

  it("TypeError message mentions the requirement", () => {
    expect(() => (zip as (...args: unknown[][]) => unknown)([1]))
      .toThrowError("zip requires at least two arrays");
  });

  // ---------------------------------------------------------------------------
  // Large arrays (no stack overflow)
  // ---------------------------------------------------------------------------

  it("handles large arrays without stack overflow", () => {
    const size = 100_000;
    const a = Array.from({ length: size }, (_, i) => i);
    const b = Array.from({ length: size }, (_, i) => i * 2);
    const result = zip(a, b);
    expect(result).toHaveLength(size);
    expect(result[0]).toEqual([0, 0]);
    expect(result[size - 1]).toEqual([size - 1, (size - 1) * 2]);
  });
});
