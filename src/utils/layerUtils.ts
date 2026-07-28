/**
 * Layer data processing utilities
 */

export interface LayerKeyValuePair {
  key: string;
  value: any;
  type: "string" | "number" | "boolean" | "object" | "array" | "null";
  originalKey: string;
}

export type ValueType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "null";

/**
 * Get the type of a value
 */
export const getValueType = (value: any): ValueType => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as ValueType;
};

/**
 * Parse layer details JSON (supports both flat objects and Attributes arrays)
 * Format: { key: value, ..., Attributes: [{ Key, Value }, ...] }
 */
export const parseLayerDetails = (
  jsonString: string | undefined,
): LayerKeyValuePair[] => {
  if (!jsonString) return [];

  try {
    const parsed = JSON.parse(jsonString);

    // Handle both flat key-value pairs and nested Attributes array
    if (parsed.Attributes && Array.isArray(parsed.Attributes)) {
      const kvPairs: LayerKeyValuePair[] = [];

      // Add root properties first
      Object.entries(parsed).forEach(([key, value]) => {
        if (key !== "Attributes") {
          kvPairs.push({
            key: key.toLowerCase(),
            value,
            type: getValueType(value),
            originalKey: key,
          });
        }
      });

      // Add Attributes as key-value pairs
      parsed.Attributes.forEach((attr: any) => {
        if (attr.Key && attr.Value !== undefined) {
          kvPairs.push({
            key: attr.Key.toLowerCase(),
            value: attr.Value,
            type: getValueType(attr.Value),
            originalKey: attr.Key,
          });
        }
      });

      return kvPairs;
    }

    // Handle flat key-value objects
    return Object.entries(parsed).map(([key, value]) => ({
      key: key.toLowerCase(),
      value,
      type: getValueType(value),
      originalKey: key,
    }));
  } catch {
    return [];
  }
};

/**
 * Format a value for display
 */
export const formatLayerValue = (value: any, type: ValueType): string => {
  if (type === "null") return "null";
  if (type === "boolean") return String(value);
  if (type === "number") return String(value);
  if (type === "string") return String(value);
  if (type === "array") return `[${(value as any[]).length} items]`;
  if (type === "object") return "";
  return String(value);
};

/**
 * Get badge color for a value type
 */
export const getTypeBadgeColor = (
  type: ValueType,
): "success" | "informative" | "warning" | "subtle" => {
  switch (type) {
    case "string":
      return "success";
    case "number":
      return "informative";
    case "boolean":
      return "informative";
    case "array":
      return "warning";
    case "object":
      return "warning";
    case "null":
      return "subtle";
    default:
      return "subtle";
  }
};

/**
 * Count matches of a search term in text
 */
export const countMatches = (text: string, searchTerm: string): number => {
  if (!searchTerm) return 0;
  const regex = new RegExp(
    searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi",
  );
  const matches = text.match(regex);
  return matches ? matches.length : 0;
};

/**
 * Filter key-value pairs based on search text
 * Searches in keys, values, and nested object/array contents
 */
export const filterLayerDetails = (
  pairs: LayerKeyValuePair[],
  searchTerm: string,
): LayerKeyValuePair[] => {
  if (!searchTerm.trim()) return pairs;

  const searchLower = searchTerm.toLowerCase();

  return pairs.filter((pair) => {
    const keyMatches = pair.key.includes(searchLower);
    const valueMatches = String(pair.value).toLowerCase().includes(searchLower);

    if (keyMatches || valueMatches) {
      return true;
    }

    // Check subelements (arrays and objects)
    if (Array.isArray(pair.value)) {
      return pair.value.some((item) => {
        const itemStr = JSON.stringify(item).toLowerCase();
        return itemStr.includes(searchLower);
      });
    }

    if (pair.value && typeof pair.value === "object") {
      return Object.entries(pair.value).some(([k, v]) => {
        const keyStr = k.toLowerCase();
        const valStr = JSON.stringify(v).toLowerCase();
        return keyStr.includes(searchLower) || valStr.includes(searchLower);
      });
    }

    return false;
  });
};
