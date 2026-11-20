import { describe, expect, it } from "vitest";
import { slugify } from "../src/strings/slugify";

describe("slugify", () => {
  it("lower-cases and hyphenates words", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("strips diacritics", () => {
    expect(slugify("Crème Brûlée")).toBe("creme-brulee");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  --Agent Forge--  ")).toBe("agent-forge");
  });

  it("supports a custom separator", () => {
    expect(slugify("a b c", "_")).toBe("a_b_c");
  });

  it("returns an empty string for symbol-only input", () => {
    expect(slugify("!!!")).toBe("");
  });
});
