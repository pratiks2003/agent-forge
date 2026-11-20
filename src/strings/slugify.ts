/**
 * Converts arbitrary text into a URL-safe slug.
 *
 * @example slugify("Hello, World!") // "hello-world"
 * @param input - Text to convert.
 * @param separator - Character placed between words (default "-").
 * @returns Lower-case slug containing only [a-z0-9] and the separator.
 */
export function slugify(input: string, separator = "-"): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${escape(separator)}+|${escape(separator)}+$`, "g"), "");
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
