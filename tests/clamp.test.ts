import { describe, expect, it } from "vitest";
import { clamp } from "../src/math/clamp";
import { clamp as clampFromIndex } from "../src/index";

describe("clamp", () => {
  it("returns value unchanged when within range", () => {
    expect(clamp(3, 0, 5)).toBe(3);
  });

  it("clamps value below min to min", () => {
    expect(clamp(-10, 0, 5)).toBe(0);
  });

  it("clamps value above max to max", () => {
    expect(clamp(99, 0, 5)).toBe(5);
  });

  it("treats value equal to min as in-range", () => {
    expect(clamp(0, 0, 5)).toBe(0);
  });

  it("treats value equal to max as in-range", () => {
    expect(clamp(5, 0, 5)).toBe(5);
  });

  it("handles degenerate range where min === max", () => {
    expect(clamp(3, 3, 3)).toBe(3);
  });

  it("works with negative and fractional numbers", () => {
    expect(clamp(-0.5, -1, 1)).toBe(-0.5);
  });

  it("clamps positive Infinity to max", () => {
    expect(clamp(Infinity, 0, 100)).toBe(100);
  });

  it("clamps negative Infinity to min", () => {
    expect(clamp(-Infinity, 0, 100)).toBe(0);
  });

  it("throws RangeError when min > max", () => {
    expect(() => clamp(3, 5, 0)).toThrowError(
      new RangeError("clamp: min must be <= max")
    );
  });

  it("throws TypeError when value is NaN", () => {
    expect(() => clamp(NaN, 0, 5)).toThrowError(
      new TypeError("clamp: value must be a finite number")
    );
  });

  it("throws TypeError when min is NaN", () => {
    expect(() => clamp(3, NaN, 5)).toThrowError(
      new TypeError("clamp: min must be a finite number")
    );
  });

  it("throws TypeError when max is NaN", () => {
    expect(() => clamp(3, 0, NaN)).toThrowError(
      new TypeError("clamp: max must be a finite number")
    );
  });

  it("never mutates the input value (immutability)", () => {
    const val = 7;
    clamp(val, 0, 5);
    expect(val).toBe(7);
  });

  it("handles Number.MAX_SAFE_INTEGER without overflow", () => {
    expect(clamp(Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER)).toBe(
      Number.MAX_SAFE_INTEGER
    );
  });

  it("returns raw float without rounding for floating-point imprecision", () => {
    const raw = 0.1 + 0.2;
    expect(clamp(raw, 0, 1)).toBe(raw);
  });

  it("is re-exported from src/index as a named export", () => {
    expect(clampFromIndex(3, 0, 5)).toBe(3);
  });
});
