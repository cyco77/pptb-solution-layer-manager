import { describe, it, expect } from "vitest";
import {
  generateMockLayerJson,
  generateMockLayerPairs,
  generateMixedTypePairs,
  generateMockComponentLayer,
  generateMockComponentLayers,
} from "./testUtils";

describe("Test Utilities", () => {
  describe("generateMockLayerJson", () => {
    it("should generate valid JSON", () => {
      const json = generateMockLayerJson();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("should include default properties", () => {
      const json = generateMockLayerJson();
      const parsed = JSON.parse(json);

      expect(parsed.msdyn_solutionname).toBe("Active");
      expect(parsed.msdyn_componentlayerid).toBeDefined();
      expect(parsed.Attributes).toBeDefined();
      expect(Array.isArray(parsed.Attributes)).toBe(true);
    });

    it("should allow property overrides", () => {
      const json = generateMockLayerJson({
        msdyn_solutionname: "Custom",
        customProp: "custom-value",
      });
      const parsed = JSON.parse(json);

      expect(parsed.msdyn_solutionname).toBe("Custom");
      expect(parsed.customProp).toBe("custom-value");
    });
  });

  describe("generateMockLayerPairs", () => {
    it("should generate correct number of pairs", () => {
      expect(generateMockLayerPairs(5)).toHaveLength(5);
      expect(generateMockLayerPairs(0)).toHaveLength(0);
    });

    it("should have correct structure", () => {
      const pairs = generateMockLayerPairs(1);
      expect(pairs[0]).toHaveProperty("key");
      expect(pairs[0]).toHaveProperty("value");
      expect(pairs[0]).toHaveProperty("type");
      expect(pairs[0]).toHaveProperty("originalKey");
    });

    it("should generate string type values", () => {
      const pairs = generateMockLayerPairs(3);
      pairs.forEach((pair) => {
        expect(pair.type).toBe("string");
        expect(typeof pair.value).toBe("string");
      });
    });

    it("should preserve original key casing", () => {
      const pairs = generateMockLayerPairs(2);
      expect(pairs[0].originalKey).toBe("Key0");
      expect(pairs[1].originalKey).toBe("Key1");
    });
  });

  describe("generateMixedTypePairs", () => {
    it("should generate pairs with all types", () => {
      const pairs = generateMixedTypePairs();

      const types = pairs.map((p) => p.type);
      expect(types).toContain("string");
      expect(types).toContain("number");
      expect(types).toContain("boolean");
      expect(types).toContain("array");
      expect(types).toContain("object");
      expect(types).toContain("null");
    });

    it("should have valid values for each type", () => {
      const pairs = generateMixedTypePairs();

      const stringPair = pairs.find((p) => p.type === "string");
      expect(typeof stringPair?.value).toBe("string");

      const numberPair = pairs.find((p) => p.type === "number");
      expect(typeof numberPair?.value).toBe("number");

      const booleanPair = pairs.find((p) => p.type === "boolean");
      expect(typeof booleanPair?.value).toBe("boolean");

      const arrayPair = pairs.find((p) => p.type === "array");
      expect(Array.isArray(arrayPair?.value)).toBe(true);

      const objectPair = pairs.find((p) => p.type === "object");
      expect(typeof objectPair?.value).toBe("object");
      expect(!Array.isArray(objectPair?.value)).toBe(true);

      const nullPair = pairs.find((p) => p.type === "null");
      expect(nullPair?.value).toBeNull();
    });
  });

  describe("generateMockComponentLayer", () => {
    it("should generate valid component layer", () => {
      const layer = generateMockComponentLayer();

      expect(layer.msdyn_componentlayerid).toBeDefined();
      expect(layer.msdyn_componentjson).toBeDefined();
      expect(() => JSON.parse(layer.msdyn_componentjson)).not.toThrow();
    });

    it("should allow property overrides", () => {
      const layer = generateMockComponentLayer({
        msdyn_solutionname: { value: "CustomSolution" } as any,
      });

      expect(layer.msdyn_solutionname.value).toBe("CustomSolution");
    });
  });

  describe("generateMockComponentLayers", () => {
    it("should generate correct number of layers", () => {
      expect(generateMockComponentLayers(5)).toHaveLength(5);
      expect(generateMockComponentLayers(1)).toHaveLength(1);
    });

    it("should have unique layer IDs", () => {
      const layers = generateMockComponentLayers(5);
      const ids = layers.map((l) => l.msdyn_componentlayerid);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid JSON in component data", () => {
      const layers = generateMockComponentLayers(3);
      layers.forEach((layer) => {
        expect(layer.msdyn_componentjson).toBeDefined();
        if (layer.msdyn_componentjson) {
          expect(() => JSON.parse(layer.msdyn_componentjson)).not.toThrow();
        }
        if (layer.msdyn_changes) {
          expect(() => JSON.parse(layer.msdyn_changes as string)).not.toThrow();
        }
      });
    });

    it("should vary solution names", () => {
      const layers = generateMockComponentLayers(3);
      const firstLayer = layers[0];
      const otherLayers = layers.slice(1);

      expect(firstLayer.msdyn_solutionname.value).toBe("Active");
      otherLayers.forEach((layer) => {
        expect(layer.msdyn_solutionname.value).toBe("Custom");
      });
    });
  });
});
