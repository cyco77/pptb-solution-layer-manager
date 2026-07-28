/**
 * Test utilities and mock data generators for layer testing
 */

import { type LayerKeyValuePair } from "../layerUtils";

/**
 * Generate mock layer JSON for testing
 */
export const generateMockLayerJson = (
  overrides?: Record<string, any>,
): string => {
  const data = {
    msdyn_solutionname: "Active",
    msdyn_componentlayerid: "layer-123",
    msdyn_modifiedon: "2024-01-15T10:00:00Z",
    msdyn_publishedon: "2024-01-15T10:00:00Z",
    Attributes: [
      {
        Key: "CustomProperty1",
        Value: "custom-value-1",
      },
      {
        Key: "CustomProperty2",
        Value: "custom-value-2",
      },
    ],
    ...overrides,
  };
  return JSON.stringify(data);
};

/**
 * Generate mock key-value pairs
 */
export const generateMockLayerPairs = (
  count: number = 3,
): LayerKeyValuePair[] => {
  return Array.from({ length: count }, (_, i) => ({
    key: `key${i}`,
    value: `value${i}`,
    type: "string" as const,
    originalKey: `Key${i}`,
  }));
};

/**
 * Generate mock pairs with different types
 */
export const generateMixedTypePairs = (): LayerKeyValuePair[] => [
  {
    key: "stringfield",
    value: "test string",
    type: "string",
    originalKey: "StringField",
  },
  {
    key: "numberfield",
    value: 42,
    type: "number",
    originalKey: "NumberField",
  },
  {
    key: "booleanfield",
    value: true,
    type: "boolean",
    originalKey: "BooleanField",
  },
  {
    key: "arrayfield",
    value: [1, 2, 3],
    type: "array",
    originalKey: "ArrayField",
  },
  {
    key: "objectfield",
    value: { nested: "data" },
    type: "object",
    originalKey: "ObjectField",
  },
  {
    key: "nullfield",
    value: null,
    type: "null",
    originalKey: "NullField",
  },
];

/**
 * Mock component layer response
 */
export interface MockComponentLayer {
  msdyn_componentlayerid: string;
  msdyn_componentjson: string;
  msdyn_changes?: string;
  msdyn_children?: string;
  msdyn_solutionname: { value: string };
}

/**
 * Generate mock component layer
 */
export const generateMockComponentLayer = (
  overrides?: Partial<MockComponentLayer>,
): MockComponentLayer => {
  return {
    msdyn_componentlayerid: "layer-123",
    msdyn_componentjson: generateMockLayerJson(),
    msdyn_changes: JSON.stringify({ Changed: true }),
    msdyn_children: JSON.stringify({ ChildCount: 0 }),
    msdyn_solutionname: { value: "Active" },
    ...overrides,
  };
};

/**
 * Generate mock component layers array
 */
export const generateMockComponentLayers = (
  count: number = 3,
): MockComponentLayer[] => {
  return Array.from({ length: count }, (_, i) => ({
    msdyn_componentlayerid: `layer-${i + 1}`,
    msdyn_componentjson: generateMockLayerJson({
      msdyn_componentlayerid: `layer-${i + 1}`,
    }),
    msdyn_changes: JSON.stringify({
      ChangeType: i % 2 === 0 ? "Add" : "Update",
    }),
    msdyn_children: JSON.stringify({ ChildCount: Math.random() * 5 }),
    msdyn_solutionname: { value: i === 0 ? "Active" : "Custom" },
  }));
};
