/**
 * Returns a debounced version of `fn` that delays invoking `fn` until `waitMs`
 * milliseconds have elapsed since the last time the debounced function was called.
 * Calling `.cancel()` on the returned function clears any pending invocation.
 *
 * @param fn     - The function to debounce. Never mutated.
 * @param waitMs - Quiet period in milliseconds. Must be >= 0.
 * @returns A debounced wrapper with an additional `.cancel()` method.
 * @throws {RangeError} If `waitMs` is less than 0.
 *
 * @example
 * const save = debounce((text: string) => api.save(text), 300);
 * save('a'); save('b'); save('c'); // only the last call fires after 300 ms
 *
 * @complexity O(1) per call; one pending timer at most.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): T & { cancel(): void } {
  if (waitMs < 0) {
    throw new RangeError('waitMs must be >= 0');
  }

  let timerId: ReturnType<typeof setTimeout> | undefined;

  function debounced(this: unknown, ...args: Parameters<T>): void {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = undefined;
      fn.apply(this, args);
    }, waitMs);
  }

  debounced.cancel = function cancel(): void {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  };

  return debounced as unknown as T & { cancel(): void };
}
