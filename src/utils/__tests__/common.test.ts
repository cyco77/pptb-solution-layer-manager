import { describe, it, expect } from "vitest";
import {
  formatJson,
  safeJsonParse,
  truncateString,
  matchesSearchTerm,
} from "../common";

describe("common utilities", () => {
  describe("formatJson", () => {
    it("should format a JSON object", () => {
      const result = formatJson({ name: "test", value: 123 });
      expect(result).toContain("name");
      expect(result).toContain("test");
      expect(result).toContain("123");
    });

    it("should format a JSON string", () => {
      const result = formatJson('{"name":"test"}');
      expect(result).toContain("name");
      expect(result).toContain("test");
    });

    it("should return empty string for invalid JSON", () => {
      const result = formatJson("{invalid json}");
      expect(result).toBe("");
    });

    it("should use custom indent", () => {
      const result = formatJson({ a: 1 }, 4);
      expect(result).toContain("    "); // 4 spaces
    });
  });

  describe("safeJsonParse", () => {
    it("should parse valid JSON", () => {
      const result = safeJsonParse('{"name":"test"}');
      expect(result).toEqual({ name: "test" });
    });

    it("should return null for invalid JSON", () => {
      const result = safeJsonParse("{invalid}");
      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      const result = safeJsonParse(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = safeJsonParse(undefined);
      expect(result).toBeNull();
    });

    it("should parse arrays", () => {
      const result = safeJsonParse("[1,2,3]");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("truncateString", () => {
    it("should not truncate short strings", () => {
      const result = truncateString("hello", 10);
      expect(result).toBe("hello");
    });

    it("should truncate long strings", () => {
      const result = truncateString("hello world", 8);
      expect(result).toBe("hello...");
      expect(result.length).toBe(8);
    });

    it("should handle exact length", () => {
      const result = truncateString("hello", 5);
      expect(result).toBe("hello");
    });

    it("should handle empty string", () => {
      const result = truncateString("", 10);
      expect(result).toBe("");
    });
  });

  describe("matchesSearchTerm", () => {
    it("should match strings", () => {
      const result = matchesSearchTerm("hello world", "world");
      expect(result).toBe(true);
    });

    it("should be case-insensitive", () => {
      const result = matchesSearchTerm("Hello World", "WORLD");
      expect(result).toBe(true);
    });

    it("should not match non-existent terms", () => {
      const result = matchesSearchTerm("hello", "xyz");
      expect(result).toBe(false);
    });

    it("should return true for empty search term", () => {
      const result = matchesSearchTerm("hello", "");
      expect(result).toBe(true);
    });

    it("should work with objects", () => {
      const result = matchesSearchTerm({ name: "test", id: 123 }, "test");
      expect(result).toBe(true);
    });

    it("should work with arrays", () => {
      const result = matchesSearchTerm(["item1", "item2"], "item");
      expect(result).toBe(true);
    });
  });
});
