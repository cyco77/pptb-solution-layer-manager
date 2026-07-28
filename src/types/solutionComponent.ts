import { ComponentLayer } from "./componentLayer";

export type SolutionComponent = {
  solutioncomponentid: string;
  objectid: string;
  componenttype: number;
  componenttypeName: string;
  name?: string;
};

export type ComponentWithLayers = SolutionComponent & {
  layers: ComponentLayer[] | null; // null = not yet loaded
};

export type ComponentTypeDefinition = {
  solutioncomponenttype: number;
  name: string;
  /** The msdyn_solutioncomponentname value used in layer queries — loaded from solutioncomponentdefinitions */
  layerName?: string;
};
