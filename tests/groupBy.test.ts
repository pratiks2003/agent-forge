import { describe, expect, it } from "vitest";
import { groupBy } from "../src/arrays/groupBy";

describe("groupBy", () => {
  it("groups numbers into odd and even buckets", () => {
    const result = groupBy([1, 2, 3, 4], x => x % 2 === 0 ? "even" : "odd");
    expect(result.get("odd")).toEqual([1, 3]);
    expect(result.get("even")).toEqual([2, 4]);
  });

  it("preserves original element order within each bucket", () => {
    const result = groupBy([4, 1, 3, 2], x => x % 2 === 0 ? "even" : "odd");
    expect(result.get("even")).toEqual([4, 2]);
    expect(result.get("odd")).toEqual([1, 3]);
  });

  it("Map iteration order reflects first-seen key order", () => {
    const result = groupBy([1, 2, 3, 4], x => x % 2 === 0 ? "even" : "odd");
    expect([...result.keys()]).toEqual(["odd", "even"]);
  });

  it("returns an empty Map for an empty input array", () => {
    const fn = (x: number) => x;
    const spy = { calls: 0, fn: (x: number) => { spy.calls++; return x; } };
    const result = groupBy([], spy.fn);
    expect(result.size).toBe(0);
    expect(spy.calls).toBe(0);
  });

  it("handles a single-element array producing one group of size 1", () => {
    const result = groupBy([42], x => x);
    expect(result.size).toBe(1);
    expect(result.get(42)).toEqual([42]);
  });

  it("handles all elements sharing the same key", () => {
    const result = groupBy([1, 2, 3], () => "all");
    expect(result.size).toBe(1);
    expect(result.get("all")).toEqual([1, 2, 3]);
  });

  it("handles all elements having unique keys (n groups of size 1)", () => {
    const result = groupBy([10, 20, 30], x => x);
    expect(result.size).toBe(3);
    expect(result.get(10)).toEqual([10]);
    expect(result.get(20)).toEqual([20]);
    expect(result.get(30)).toEqual([30]);
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4];
    const copy = [...input];
    groupBy(input, x => x % 2);
    expect(input).toEqual(copy);
  });

  it("returned group arrays are independent copies (mutating them does not affect re-runs)", () => {
    const input = [1, 2, 3];
    const result1 = groupBy(input, () => "all");
    const group = result1.get("all");
    expect(group).toBeDefined();
    group!.push(999);
    const result2 = groupBy(input, () => "all");
    expect(result2.get("all")).toEqual([1, 2, 3]);
  });

  it("accepts number keys", () => {
    const result = groupBy([1.1, 1.9, 2.5, 2.1], x => Math.floor(x));
    expect(result.get(1)).toEqual([1.1, 1.9]);
    expect(result.get(2)).toEqual([2.5, 2.1]);
  });

  it("accepts symbol keys", () => {
    const sym = Symbol.for("group");
    const result = groupBy(["a", "b", "c"], () => sym);
    expect(result.size).toBe(1);
    expect(result.get(sym)).toEqual(["a", "b", "c"]);
  });

  it("throws TypeError with message containing 'keyFn must be a function' when keyFn is null", () => {
    expect(() => groupBy([1, 2], null as unknown as (x: number) => string))
      .toThrowError(TypeError);
    expect(() => groupBy([1, 2], null as unknown as (x: number) => string))
      .toThrowError("keyFn must be a function");
  });

  it("throws TypeError when keyFn is undefined", () => {
    expect(() => groupBy([1], undefined as unknown as (x: number) => string))
      .toThrowError(TypeError);
  });

  it("throws TypeError when keyFn is a plain object", () => {
    expect(() => groupBy([1], {} as unknown as (x: number) => string))
      .toThrowError(TypeError);
  });

  it("handles a large array (100 000 elements) without stack overflow", () => {
    const size = 100_000;
    const input = Array.from({ length: size }, (_, i) => i);
    const result = groupBy(input, x => x % 10);
    expect(result.size).toBe(10);
    for (let k = 0; k < 10; k++) {
      expect(result.get(k)?.length).toBe(size / 10);
    }
  });

  it("works with objects grouped by a property", () => {
    const users = [
      { name: "Alice", role: "admin" },
      { name: "Bob", role: "user" },
      { name: "Carol", role: "admin" },
    ];
    const result = groupBy(users, u => u.role);
    expect(result.get("admin")?.map(u => u.name)).toEqual(["Alice", "Carol"]);
    expect(result.get("user")?.map(u => u.name)).toEqual(["Bob"]);
  });
});
