/**
 * Common utility functions for the Solution Layer Manager
 */

/**
 * Format a JSON string with proper indentation
 */
export const formatJson = (
  json: string | object,
  indent: number = 2,
): string => {
  try {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    return JSON.stringify(parsed, null, indent);
  } catch {
    return "";
  }
};

/**
 * Safely parse a JSON string
 */
export const safeJsonParse = <T = unknown>(
  json: string | null | undefined,
): T | null => {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

/**
 * Truncate a string to a maximum length with ellipsis
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
};

/**
 * Check if a value matches a search term (case-insensitive)
 */
export const matchesSearchTerm = (
  value: unknown,
  searchTerm: string,
): boolean => {
  if (!searchTerm) return true;
  const lowerSearchTerm = searchTerm.toLowerCase();
  const stringValue = JSON.stringify(value).toLowerCase();
  return stringValue.includes(lowerSearchTerm);
};
