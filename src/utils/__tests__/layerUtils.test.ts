import { describe, it, expect } from "vitest";
import {
  getValueType,
  parseLayerDetails,
  formatLayerValue,
  getTypeBadgeColor,
  countMatches,
  filterLayerDetails,
  type LayerKeyValuePair,
} from "../layerUtils";

describe("Layer Utilities", () => {
  describe("getValueType", () => {
    it("should return 'null' for null values", () => {
      expect(getValueType(null)).toBe("null");
    });

    it("should return 'string' for strings", () => {
      expect(getValueType("hello")).toBe("string");
      expect(getValueType("")).toBe("string");
    });

    it("should return 'number' for numbers", () => {
      expect(getValueType(42)).toBe("number");
      expect(getValueType(0)).toBe("number");
      expect(getValueType(-3.14)).toBe("number");
    });

    it("should return 'boolean' for booleans", () => {
      expect(getValueType(true)).toBe("boolean");
      expect(getValueType(false)).toBe("boolean");
    });

    it("should return 'array' for arrays", () => {
      expect(getValueType([])).toBe("array");
      expect(getValueType([1, 2, 3])).toBe("array");
      expect(getValueType(["a", "b"])).toBe("array");
    });

    it("should return 'object' for objects", () => {
      expect(getValueType({})).toBe("object");
      expect(getValueType({ a: 1 })).toBe("object");
    });
  });

  describe("parseLayerDetails", () => {
    it("should return empty array for undefined input", () => {
      expect(parseLayerDetails(undefined)).toEqual([]);
    });

    it("should return empty array for invalid JSON", () => {
      expect(parseLayerDetails("{invalid}")).toEqual([]);
    });

    it("should parse flat key-value object", () => {
      const json = JSON.stringify({ name: "test", value: 123 });
      const result = parseLayerDetails(json);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe("name");
      expect(result[0].value).toBe("test");
      expect(result[0].type).toBe("string");
    });

    it("should parse object with Attributes array", () => {
      const json = JSON.stringify({
        name: "root",
        Attributes: [
          { Key: "attr1", Value: "value1" },
          { Key: "attr2", Value: 42 },
        ],
      });
      const result = parseLayerDetails(json);

      expect(result).toHaveLength(3); // root + 2 attributes
      expect(result[0].key).toBe("name");
      expect(result[1].key).toBe("attr1");
      expect(result[2].key).toBe("attr2");
    });

    it("should preserve original key casing", () => {
      const json = JSON.stringify({ MyKey: "value" });
      const result = parseLayerDetails(json);

      expect(result[0].key).toBe("mykey");
      expect(result[0].originalKey).toBe("MyKey");
    });

    it("should handle nested objects", () => {
      const json = JSON.stringify({
        data: { nested: { value: 123 } },
      });
      const result = parseLayerDetails(json);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("object");
      expect(result[0].value).toEqual({ nested: { value: 123 } });
    });

    it("should handle arrays", () => {
      const json = JSON.stringify({ items: [1, 2, 3] });
      const result = parseLayerDetails(json);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("array");
      expect(result[0].value).toEqual([1, 2, 3]);
    });
  });

  describe("formatLayerValue", () => {
    it("should format null as 'null'", () => {
      expect(formatLayerValue(null, "null")).toBe("null");
    });

    it("should format strings as-is", () => {
      expect(formatLayerValue("hello", "string")).toBe("hello");
    });

    it("should format numbers as strings", () => {
      expect(formatLayerValue(42, "number")).toBe("42");
      expect(formatLayerValue(3.14, "number")).toBe("3.14");
    });

    it("should format booleans as strings", () => {
      expect(formatLayerValue(true, "boolean")).toBe("true");
      expect(formatLayerValue(false, "boolean")).toBe("false");
    });

    it("should format arrays with item count", () => {
      expect(formatLayerValue([1, 2, 3], "array")).toBe("[3 items]");
      expect(formatLayerValue([], "array")).toBe("[0 items]");
    });

    it("should format objects as empty string", () => {
      expect(formatLayerValue({}, "object")).toBe("");
      expect(formatLayerValue({ a: 1 }, "object")).toBe("");
    });
  });

  describe("getTypeBadgeColor", () => {
    it("should return 'success' for strings", () => {
      expect(getTypeBadgeColor("string")).toBe("success");
    });

    it("should return 'informative' for numbers", () => {
      expect(getTypeBadgeColor("number")).toBe("informative");
    });

    it("should return 'informative' for booleans", () => {
      expect(getTypeBadgeColor("boolean")).toBe("informative");
    });

    it("should return 'warning' for arrays", () => {
      expect(getTypeBadgeColor("array")).toBe("warning");
    });

    it("should return 'warning' for objects", () => {
      expect(getTypeBadgeColor("object")).toBe("warning");
    });

    it("should return 'subtle' for null", () => {
      expect(getTypeBadgeColor("null")).toBe("subtle");
    });
  });

  describe("countMatches", () => {
    it("should return 0 for empty search term", () => {
      expect(countMatches("hello world", "")).toBe(0);
    });

    it("should count single match", () => {
      expect(countMatches("hello world", "world")).toBe(1);
    });

    it("should count multiple matches", () => {
      expect(countMatches("hello hello hello", "hello")).toBe(3);
    });

    it("should be case-insensitive", () => {
      expect(countMatches("Hello WORLD", "hello")).toBe(1);
      expect(countMatches("HELLO hello", "HELLO")).toBe(2);
    });

    it("should handle special regex characters", () => {
      expect(countMatches("test.value", ".")).toBe(1);
      expect(countMatches("a+b+c", "+")).toBe(2);
    });

    it("should return 0 for non-matching term", () => {
      expect(countMatches("hello", "xyz")).toBe(0);
    });
  });

  describe("filterLayerDetails", () => {
    const pairs: LayerKeyValuePair[] = [
      {
        key: "name",
        value: "test",
        type: "string",
        originalKey: "name",
      },
      {
        key: "count",
        value: 42,
        type: "number",
        originalKey: "count",
      },
      {
        key: "items",
        value: [1, 2, 3],
        type: "array",
        originalKey: "items",
      },
      {
        key: "data",
        value: { nested: "value" },
        type: "object",
        originalKey: "data",
      },
    ];

    it("should return all pairs for empty search term", () => {
      expect(filterLayerDetails(pairs, "")).toEqual(pairs);
      expect(filterLayerDetails(pairs, "   ")).toEqual(pairs);
    });

    it("should filter by key match", () => {
      const result = filterLayerDetails(pairs, "name");
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("name");
    });

    it("should filter by value match", () => {
      const result = filterLayerDetails(pairs, "test");
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("test");
    });

    it("should filter by numeric value", () => {
      const result = filterLayerDetails(pairs, "42");
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("count");
    });

    it("should filter by nested object value", () => {
      const result = filterLayerDetails(pairs, "nested");
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("data");
    });

    it("should filter by array item value", () => {
      const result = filterLayerDetails(pairs, "3");
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("items");
    });

    it("should be case-insensitive", () => {
      const result = filterLayerDetails(pairs, "TEST");
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("name");
    });

    it("should return empty array for non-matching search", () => {
      const result = filterLayerDetails(pairs, "xyz");
      expect(result).toHaveLength(0);
    });

    it("should match multiple fields", () => {
      const result = filterLayerDetails(pairs, "a");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
