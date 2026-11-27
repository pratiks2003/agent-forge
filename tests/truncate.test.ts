import { describe, expect, it } from "vitest";
import { truncate } from "../src/strings/truncate";

describe("truncate", () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("truncates text and appends default ellipsis", () => {
    expect(truncate("Hello, World!", 5)).toBe("He...");
  });

  it("returns text unchanged when shorter than maxLength", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });

  it("returns text unchanged when exactly equal to maxLength", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("truncates when text is one character over the limit", () => {
    expect(truncate("Hello!", 5)).toBe("He...");
  });

  // ---------------------------------------------------------------------------
  // Custom ellipsis
  // ---------------------------------------------------------------------------

  it("uses a custom ellipsis string", () => {
    expect(truncate("Hello, World!", 8, "--")).toBe("Hello, --");
  });

  it("treats empty ellipsis as a hard slicer (text fits)", () => {
    expect(truncate("Hello", 10, "")).toBe("Hello");
  });

  it("treats empty ellipsis as a hard slicer (text truncated)", () => {
    expect(truncate("Hello World", 7, "")).toBe("Hello W");
  });

  // ---------------------------------------------------------------------------
  // Edge cases — empty input
  // ---------------------------------------------------------------------------

  it("returns empty string for empty input", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("returns empty string for empty input with custom ellipsis", () => {
    expect(truncate("", 5, "--")).toBe("");
  });

  // ---------------------------------------------------------------------------
  // RangeError — invalid maxLength
  // ---------------------------------------------------------------------------

  it("throws RangeError when maxLength is 0", () => {
    expect(() => truncate("Hello", 0)).toThrowError(RangeError);
  });

  it("throws RangeError when maxLength is negative", () => {
    expect(() => truncate("Hello", -1)).toThrowError(RangeError);
  });

  it("throws RangeError when maxLength is a non-integer (4.5)", () => {
    expect(() => truncate("Hello", 4.5)).toThrowError(RangeError);
  });

  it("throws RangeError when maxLength is NaN", () => {
    expect(() => truncate("Hello", NaN)).toThrowError(RangeError);
  });

  it("throws RangeError when maxLength is Infinity", () => {
    expect(() => truncate("Hello", Infinity)).toThrowError(RangeError);
  });

  // ---------------------------------------------------------------------------
  // RangeError — ellipsis too long
  // ---------------------------------------------------------------------------

  it("throws RangeError when ellipsis.length equals maxLength", () => {
    expect(() => truncate("Hello", 3, "...")).toThrowError(RangeError);
  });

  it("throws RangeError when ellipsis.length exceeds maxLength", () => {
    expect(() => truncate("Hello", 2, "...")).toThrowError(RangeError);
  });

  it("throws RangeError with descriptive message for ellipsis >= maxLength", () => {
    expect(() => truncate("Hello", 3, "...")).toThrow(
      /ellipsis.length.*must be less than maxLength/,
    );
  });

  it("throws RangeError with descriptive message for invalid maxLength", () => {
    expect(() => truncate("Hello", 0)).toThrow(
      /maxLength must be a positive integer/,
    );
  });

  // ---------------------------------------------------------------------------
  // Immutability
  // ---------------------------------------------------------------------------

  it("does not mutate the input string", () => {
    const original = "Hello, World!";
    const copy = original;
    truncate(original, 5);
    expect(original).toBe(copy);
  });

  // ---------------------------------------------------------------------------
  // Large input
  // ---------------------------------------------------------------------------

  it("handles a very long string efficiently", () => {
    const long = "a".repeat(100_000);
    const result = truncate(long, 10);
    expect(result).toBe("aaaaaaa...");
    expect(result.length).toBe(10);
  });

  // ---------------------------------------------------------------------------
  // Single-character maxLength (valid: maxLength=1, ellipsis='')
  // ---------------------------------------------------------------------------

  it("works with maxLength=1 and empty ellipsis", () => {
    expect(truncate("Hello", 1, "")).toBe("H");
  });

  it("works with maxLength=1 and empty ellipsis on short input", () => {
    expect(truncate("H", 1, "")).toBe("H");
  });
});
