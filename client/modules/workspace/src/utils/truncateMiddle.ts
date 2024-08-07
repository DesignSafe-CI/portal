/**
 * Truncates a string with ellipses in the middle.
 *
 * @param {string} s - A string param
 * @param {number} maxLen - Maximum length of resulting string, including ellipses
 * @return {string} Truncated string
 *
 * @example
 * // returns "this...ing"
 * truncateMiddle('this is a long string', 10)
 */
export function truncateMiddle(s: string, maxLen: number) {
  if (!s) {
    return '';
  }
  if (maxLen < 5) {
    throw new Error(
      'Cannot middle truncate string with a maximum length less than 5.'
    );
  }
  if (s.length > maxLen) {
    // starting index of ellipses
    const start = Math.max(1, Math.floor(maxLen / 2) - 1);
    // ending index of ellipses
    const end = -Math.max(1, Math.ceil(maxLen / 2) - 2);
    return `${s.substring(0, start)}...${s.slice(end)}`;
  }
  return s;
}
