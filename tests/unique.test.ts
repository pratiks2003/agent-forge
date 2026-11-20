import { describe, expect, it } from "vitest";
import { unique } from "../src/arrays/unique";

describe("unique", () => {
  it("removes duplicates preserving first-seen order", () => {
    expect(unique([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
  });

  it("supports a key projection", () => {
    const users = [{ id: 1, n: "a" }, { id: 1, n: "b" }, { id: 2, n: "c" }];
    expect(unique(users, (u) => u.id).map((u) => u.n)).toEqual(["a", "c"]);
  });

  it("does not mutate the input", () => {
    const input = [1, 1];
    unique(input);
    expect(input).toEqual([1, 1]);
  });

  it("handles empty arrays", () => {
    expect(unique([])).toEqual([]);
  });
});
