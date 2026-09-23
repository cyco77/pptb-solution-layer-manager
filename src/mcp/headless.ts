import {
  loadActiveLayerDetailsForComponents,
  loadComponentTypeDefinitions,
  loadSolutionComponents,
  loadSolutions,
  loadSystemUser,
} from "../services/dataverseService";
import type { ComponentLayer } from "../types/componentLayer";
import type { SolutionComponent } from "../types/solutionComponent";

type Operation =
  | "loadSolutionComponents"
  | "loadActiveLayers"
  | "loadActiveLayerChanges"
  | "resolveUser";

type HeadlessInput = {
  operation?: unknown;
  solutionId?: unknown;
  solutionName?: unknown;
  solutionUniqueName?: unknown;
  userId?: unknown;
  componentTypes?: unknown;
  componentTypeNames?: unknown;
  componentIds?: unknown;
};

type HeadlessContext = {
  toolId: string;
  toolName: string;
  invocationMode: "one-way" | "two-way";
  updateProgress(percent: number, message: string): void;
  logger: {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
  };
};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const asStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const values = value
    .map(asString)
    .filter((entry): entry is string => Boolean(entry));
  return values.length > 0 ? values : undefined;
};

const asNumberArray = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter(
    (entry): entry is number => typeof entry === "number" && Number.isInteger(entry),
  );
  return values.length > 0 ? values : undefined;
};

const parseJson = (value: string | undefined): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHANGE_USER_KEY_PATTERN =
  /(?:modified|changed|created|updated)by(?:id)?|(?:user|owner)(?:id)?/i;

const findChangeUserIds = (value: unknown): string[] => {
  const ids = new Set<string>();
  const visit = (current: unknown, keyPath = "") => {
    if (typeof current === "string") {
      const normalized = current.replace(/[{}]/g, "").trim();
      if (
        GUID_PATTERN.test(normalized) &&
        CHANGE_USER_KEY_PATTERN.test(keyPath)
      ) {
        ids.add(normalized.toLowerCase());
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((entry) => visit(entry, keyPath));
      return;
    }
    if (current && typeof current === "object") {
      Object.entries(current).forEach(([entryKey, entryValue]) =>
        visit(entryValue, keyPath ? `${keyPath}.${entryKey}` : entryKey),
      );
    }
  };
  visit(value);
  return [...ids];
};

const mapLayer = (layer: ComponentLayer) => ({
  layerId: layer.msdyn_componentlayerid,
  componentId: layer.msdyn_componentid,
  name: layer.msdyn_name,
  solutionName: layer.msdyn_solutionname,
  solutionComponentName: layer.msdyn_solutioncomponentname,
  order: layer.msdyn_order,
  componentJson: parseJson(layer.msdyn_componentjson),
  changes: parseJson(layer.msdyn_changes),
  children: parseJson(layer.msdyn_children),
});

const resolveSolutionId = async (input: HeadlessInput) => {
  const solutionId = asString(input.solutionId);
  if (solutionId) return solutionId;

  const name = asString(input.solutionName);
  const uniqueName = asString(input.solutionUniqueName);
  if (!name && !uniqueName) {
    throw new Error("A solutionId, solutionName, or solutionUniqueName is required.");
  }

  const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const solutions = await loadSolutions("all");
  const matches = solutions.filter((solution) =>
    (uniqueName && normalized(solution.uniquename) === normalized(uniqueName)) ||
    (name && normalized(solution.friendlyname) === normalized(name)),
  );

  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? "The requested solution could not be found."
        : "The requested solution is ambiguous. Use solutionId.",
    );
  }
  return matches[0].solutionid;
};

const selectComponents = (
  components: SolutionComponent[],
  input: HeadlessInput,
) => {
  const componentTypes = asNumberArray(input.componentTypes);
  const componentTypeNames = asStringArray(input.componentTypeNames)?.map((name) =>
    name.toLowerCase(),
  );
  const componentIds = asStringArray(input.componentIds)?.map((id) => id.toLowerCase());
  return components.filter(
    (component) =>
      (!componentTypes || componentTypes.includes(component.componenttype)) &&
      (!componentTypeNames ||
        componentTypeNames.includes(component.componenttypeName.toLowerCase())) &&
      (!componentIds || componentIds.includes(component.objectid.toLowerCase())),
  );
};

export async function invokeHeadless(
  input: HeadlessInput,
  context: HeadlessContext,
) {
  const operation = asString(input?.operation) as Operation | undefined;
  if (operation === "resolveUser") {
    context.updateProgress(50, "loading user");
    const userId = asString(input.userId);
    if (!userId) throw new Error("userId is required for resolveUser.");
    const user = await loadSystemUser(userId);
    context.updateProgress(100, "done");
    return { status: "success", operation, userId, user };
  }

  if (
    operation !== "loadSolutionComponents" &&
    operation !== "loadActiveLayers" &&
    operation !== "loadActiveLayerChanges"
  ) {
    throw new Error(
      "operation must be loadSolutionComponents, loadActiveLayers, or loadActiveLayerChanges.",
    );
  }

  context.logger.info(`Starting ${operation}`);
  context.updateProgress(10, "resolving solution");
  const solutionId = await resolveSolutionId(input);
  const definitions = await loadComponentTypeDefinitions();
  const components = selectComponents(
    await loadSolutionComponents(solutionId, definitions),
    input,
  );
  const componentResults = components.map((component) => ({
    solutionComponentId: component.solutioncomponentid,
    componentId: component.objectid,
    componentType: component.componenttype,
    componentTypeName: component.componenttypeName,
    name: component.name ?? null,
  }));

  if (operation === "loadSolutionComponents") {
    context.updateProgress(100, "done");
    return { status: "success", operation, solutionId, components: componentResults };
  }

  context.updateProgress(40, `loading active layers for ${components.length} components`);
  const layerMap = await loadActiveLayerDetailsForComponents(components);
  const userCache = new Map<string, Awaited<ReturnType<typeof loadSystemUser>>>();
  const getUser = async (userId: string) => {
    if (!userCache.has(userId)) userCache.set(userId, await loadSystemUser(userId));
    return userCache.get(userId) ?? null;
  };
  const results = componentResults.map((component) => {
    const activeLayers = (layerMap.get(component.componentId.toLowerCase()) ?? []).map(
      mapLayer,
    );
    return {
      ...component,
      activeLayers,
      changes: activeLayers.map(async (layer) => {
        const changedBy = findChangeUserIds(layer.changes)[0] ?? null;
        const changedByUser = changedBy ? await getUser(changedBy) : null;
        return {
          layerId: layer.layerId,
          componentId: layer.componentId,
          componentName: layer.name,
          solutionName: layer.solutionName,
          order: layer.order,
          changes: layer.changes,
          changedBy,
          changedByName: changedByUser?.fullname ?? null,
        };
      }),
    };
  });

  const resolvedResults = await Promise.all(
    results.map(async (component) => ({
      ...component,
      changes: await Promise.all(component.changes),
    })),
  );

  context.updateProgress(100, "done");
  return {
    status: "success",
    operation,
    solutionId,
    components: resolvedResults,
    activeLayerCount: resolvedResults.reduce(
      (count, component) => count + component.activeLayers.length,
      0,
    ),
  };
}

export default { invokeHeadless };
