import { describe, expect, it, vi } from "vitest";
import { flatMap } from "../src/arrays/flatMap";

describe("flatMap", () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("maps and flattens numeric input one level deep", () => {
    expect(flatMap([1, 2, 3], (n) => [n, n * 2])).toEqual([1, 2, 2, 4, 3, 6]);
  });

  it("maps and flattens string-split input one level deep", () => {
    expect(flatMap(["a,b", "c"], (s) => s.split(","))).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array when source array is empty", () => {
    expect(flatMap([], () => [1])).toEqual([]);
  });

  it("never calls fn when source array is empty", () => {
    const fn = vi.fn(() => [1]);
    flatMap([], fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it("returns an empty array when every inner array is empty", () => {
    expect(flatMap([1, 2, 3], () => [])).toEqual([]);
  });

  it("correctly handles a single-element input array", () => {
    expect(flatMap([42], (n) => [n, n + 1])).toEqual([42, 43]);
  });

  // ---------------------------------------------------------------------------
  // Callback arguments (index and array)
  // ---------------------------------------------------------------------------

  it("forwards correct index and array arguments to fn", () => {
    const source = ["x", "y", "z"];
    const receivedArgs: Array<[string, number, readonly string[]]> = [];

    flatMap(source, (item, index, array) => {
      receivedArgs.push([item, index, array]);
      return [item];
    });

    expect(receivedArgs).toHaveLength(3);
    expect(receivedArgs[0]).toEqual(["x", 0, source]);
    expect(receivedArgs[1]).toEqual(["y", 1, source]);
    expect(receivedArgs[2]).toEqual(["z", 2, source]);
  });

  // ---------------------------------------------------------------------------
  // Heterogeneous inner lengths
  // ---------------------------------------------------------------------------

  it("handles inner arrays of varying lengths (0, 1, 5)", () => {
    const result = flatMap([0, 1, 5], (n) => Array.from({ length: n }, (_, i) => i));
    expect(result).toEqual([0, 0, 1, 2, 3, 4]);
  });

  // ---------------------------------------------------------------------------
  // Readonly inputs
  // ---------------------------------------------------------------------------

  it("accepts readonly arrays (as const)", () => {
    const input = [1, 2, 3] as const;
    expect(flatMap(input, (n) => [n])).toEqual([1, 2, 3]);
  });

  // ---------------------------------------------------------------------------
  // Immutability
  // ---------------------------------------------------------------------------

  it("does not mutate the original input array", () => {
    const input = [1, 2, 3];
    const copy = [...input];
    flatMap(input, (n) => [n * 10]);
    expect(input).toEqual(copy);
  });

  // ---------------------------------------------------------------------------
  // Invalid arguments — TypeError
  // ---------------------------------------------------------------------------

  it("throws TypeError with descriptive message when arr is not an array (string)", () => {
    expect(() => flatMap("hello" as unknown as never[], (x) => [x])).toThrowError(
      new TypeError("flatMap: first argument must be an array"),
    );
  });

  it("throws TypeError when arr is null", () => {
    expect(() => flatMap(null as unknown as never[], (x) => [x])).toThrowError(
      TypeError,
    );
  });

  it("throws TypeError when arr is an object", () => {
    expect(() => flatMap({} as unknown as never[], (x) => [x])).toThrowError(
      TypeError,
    );
  });

  it("throws TypeError with descriptive message when fn is not a function", () => {
    expect(() => flatMap([1, 2], null as unknown as (x: number) => number[])).toThrowError(
      new TypeError("flatMap: second argument must be a function"),
    );
  });

  it("throws TypeError when fn is a number", () => {
    expect(() => flatMap([1, 2], 42 as unknown as (x: number) => number[])).toThrowError(
      TypeError,
    );
  });

  // ---------------------------------------------------------------------------
  // Large array (no stack overflow)
  // ---------------------------------------------------------------------------

  it("handles a 100,000-element array without stack overflow", () => {
    const big = Array.from({ length: 100_000 }, (_, i) => i);
    const result = flatMap(big, (n) => [n, n * 2]);
    expect(result).toHaveLength(200_000);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(1);
    expect(result[3]).toBe(2);
  });
});
