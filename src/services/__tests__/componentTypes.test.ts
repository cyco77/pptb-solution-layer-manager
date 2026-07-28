import { describe, it, expect } from "vitest";
import { COMPONENT_TYPES } from "../componentTypes";

describe("COMPONENT_TYPES", () => {
  it("should have valid component types", () => {
    expect(COMPONENT_TYPES).toBeDefined();
    expect(Array.isArray(COMPONENT_TYPES)).toBe(true);
    expect(COMPONENT_TYPES.length).toBeGreaterThan(0);
  });

  it("should have Entity as first component type", () => {
    const entity = COMPONENT_TYPES.find((ct) => ct.name === "Entity");
    expect(entity).toBeDefined();
    expect(entity?.solutioncomponenttype).toBe(1);
    expect(entity?.layerName).toBe("Entity");
  });

  it("should have unique solutioncomponenttype values", () => {
    const types = COMPONENT_TYPES.map((ct) => ct.solutioncomponenttype);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(types.length);
  });

  it("should have valid solutioncomponenttype for each entry", () => {
    COMPONENT_TYPES.forEach((ct) => {
      expect(ct.solutioncomponenttype).toBeDefined();
      expect(typeof ct.solutioncomponenttype).toBe("number");
      expect(ct.solutioncomponenttype).toBeGreaterThan(0);
    });
  });

  it("should have valid name for each entry", () => {
    COMPONENT_TYPES.forEach((ct) => {
      expect(ct.name).toBeDefined();
      expect(typeof ct.name).toBe("string");
      expect(ct.name.length).toBeGreaterThan(0);
    });
  });

  it("should have valid layerName for each entry", () => {
    COMPONENT_TYPES.forEach((ct) => {
      expect(ct.layerName).toBeDefined();
      expect(typeof ct.layerName).toBe("string");
      expect(ct.layerName.length).toBeGreaterThan(0);
    });
  });
});
