/**
 * Shortens a string to a maximum character length, appending a configurable
 * ellipsis suffix when the text is cut.
 *
 * The function operates on JavaScript's UTF-16 code-unit `.length`. Callers
 * dealing with emoji or supplementary characters (surrogate pairs) must handle
 * multi-code-unit characters themselves — a single visible emoji may consume
 * two code units and therefore count as 2 towards `maxLength`.
 *
 * @example
 * truncate('Hello, World!', 5)        // 'He...'
 * truncate('Hi', 10)                  // 'Hi'
 * truncate('Hello, World!', 8, '--')  // 'Hello, --'
 * truncate('Hello World', 7, '')      // 'Hello W'
 *
 * @param text      - The input string to truncate. Never mutated.
 * @param maxLength  - Maximum allowed length of the returned string (must be a
 *                    positive integer).
 * @param ellipsis  - Suffix appended when the text is cut (default `'...'`).
 * @returns The original string when `text.length <= maxLength`, otherwise the
 *          first `maxLength - ellipsis.length` characters concatenated with
 *          `ellipsis`.
 * @throws {RangeError} If `maxLength` is not a positive integer.
 * @throws {RangeError} If `ellipsis.length >= maxLength` (no room for content).
 *
 * @complexity O(n) where n = maxLength (string slice is proportional to the
 *             number of code units copied).
 */
export function truncate(
  text: string,
  maxLength: number,
  ellipsis = "...",
): string {
  if (!Number.isInteger(maxLength) || maxLength <= 0) {
    throw new RangeError(
      `truncate: maxLength must be a positive integer, received ${maxLength}`,
    );
  }

  if (ellipsis.length >= maxLength) {
    throw new RangeError(
      `truncate: ellipsis.length (${ellipsis.length}) must be less than maxLength (${maxLength})`,
    );
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}
