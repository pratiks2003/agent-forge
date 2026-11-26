import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "../src/async/debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Happy path — single call fires after waitMs
  // ---------------------------------------------------------------------------

  it("fires fn after the quiet period has elapsed (single call)", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
  });

  // ---------------------------------------------------------------------------
  // Coalescing — N rapid calls → 1 invocation with last args
  // ---------------------------------------------------------------------------

  it("coalesces multiple rapid calls into one invocation with the last arguments", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('a');
    debouncedFn('b');
    debouncedFn('c');

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('c');
  });

  it("does not invoke fn if cancelled before waitMs elapses (coalesced)", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn(1);
    debouncedFn(2);
    debouncedFn(3);
    debouncedFn.cancel();

    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Re-trigger after first fire
  // ---------------------------------------------------------------------------

  it("restarts the timer correctly after the debounced fn has already fired once", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 200);

    debouncedFn('first');
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenLastCalledWith('first');

    debouncedFn('second');
    vi.advanceTimersByTime(199);
    expect(fn).toHaveBeenCalledOnce(); // still just once

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  // ---------------------------------------------------------------------------
  // .cancel() suppression
  // ---------------------------------------------------------------------------

  it(".cancel() prevents fn from being called", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    debouncedFn.cancel();

    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it(".cancel() with no pending call is a no-op and does not throw", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    expect(() => debouncedFn.cancel()).not.toThrow();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it(".cancel() after fn has already fired is a no-op", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();

    expect(() => debouncedFn.cancel()).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // waitMs = 0 — fires on next tick, still coalesces same-tick calls
  // ---------------------------------------------------------------------------

  it("waitMs=0 still defers execution (does not call fn synchronously)", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 0);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("waitMs=0 coalesces same-tick rapid calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 0);

    debouncedFn('x');
    debouncedFn('y');
    debouncedFn('z');

    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('z');
  });

  // ---------------------------------------------------------------------------
  // RangeError on negative waitMs
  // ---------------------------------------------------------------------------

  it("throws RangeError immediately when waitMs is negative", () => {
    expect(() => debounce(() => {}, -1)).toThrowError(RangeError);
    expect(() => debounce(() => {}, -1)).toThrowError('waitMs must be >= 0');
  });

  it("does not throw for waitMs = 0", () => {
    expect(() => debounce(() => {}, 0)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // Argument forwarding with multiple parameters
  // ---------------------------------------------------------------------------

  it("forwards multiple arguments correctly to fn", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('hello', 42, true);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('hello', 42, true);
  });

  // ---------------------------------------------------------------------------
  // Original fn is never mutated
  // ---------------------------------------------------------------------------

  it("does not mutate the original function", () => {
    const fn = vi.fn();
    const originalKeys = Object.keys(fn);
    debounce(fn, 100);
    expect(Object.keys(fn)).toEqual(originalKeys);
  });
});
