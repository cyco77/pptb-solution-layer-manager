import { Solution } from "../types/solution";
import { ManagedFilter } from "../types/solutionFilters";
import {
  SolutionComponent,
  ComponentTypeDefinition,
} from "../types/solutionComponent";
import { ComponentLayer } from "../types/componentLayer";
import { logger } from "./loggerService";
import { COMPONENT_TYPES, getLayerName, getEntityInfo } from "./componentTypes";

const LAYER_BATCH_SIZE = 50;

const loadAllData = async (fullUrl: string) => {
  const allRecords: any[] = [];

  while (fullUrl) {
    let relativePath = fullUrl;

    if (fullUrl.startsWith("http")) {
      const url = new URL(fullUrl);
      const apiRegex = /^\/api\/data\/v\d+\.\d+\//;
      relativePath = url.pathname.replace(apiRegex, "") + url.search;
    } else if (fullUrl.startsWith("api/data/")) {
      // Strip the versioned api/data prefix for relative URLs
      const apiRegex = /^api\/data\/v\d+\.\d+\//;
      relativePath = fullUrl.replace(apiRegex, "");
    }

    const response = await window.dataverseAPI.queryData(relativePath);

    allRecords.push(...response.value);

    fullUrl = (response as any)["@odata.nextLink"] || null;
  }

  return allRecords;
};

export const loadSolutions = async (
  managedFilter: ManagedFilter = "managed",
  includeHidden = false,
): Promise<Solution[]> => {
  const filters: string[] = [];

  if (managedFilter === "managed") {
    filters.push("ismanaged eq true");
  } else if (managedFilter === "unmanaged") {
    filters.push("ismanaged eq false");
  }
  if (!includeHidden) {
    filters.push("isvisible eq true");
  }

  const filterStr =
    filters.length > 0 ? `&$filter=${filters.join(" and ")}` : "";
  const url = `solutions?$select=solutionid,uniquename,friendlyname,version,ismanaged,isvisible&$orderby=friendlyname${filterStr}`;

  const records = await loadAllData(url);

  const mapped = records.map((r: any) => ({
    solutionid: r.solutionid,
    uniquename: r.uniquename,
    friendlyname: r.friendlyname,
    version: r.version,
    ismanaged: r.ismanaged,
    isvisible: r.isvisible,
  }));

  logger.info(
    `[RESULT] loadSolutions: Loaded ${mapped.length} solutions (managedFilter=${managedFilter}, includeHidden=${includeHidden})`,
  );

  return mapped;
};

export const loadComponentTypeDefinitions = async (): Promise<
  ComponentTypeDefinition[]
> => {
  try {
    // Three-layer merge: fallback < EntityDefinitions < solutioncomponentdefinitions

    // Layer 1: Static fallback (standard component types)
    const merged = new Map<number, string>();
    COMPONENT_TYPES.forEach((d) => {
      merged.set(d.solutioncomponenttype, d.name);
    });

    // Layer 2: EntityDefinitions API (dynamic entities, overrides fallback)
    try {
      const url2 =
        "EntityDefinitions?$select=LogicalName,SchemaName,ObjectTypeCode,DisplayName&$orderby=DisplayName";
      const entityDefs = await loadAllData(url2);
      entityDefs
        .filter(
          (e: any) =>
            e.ObjectTypeCode !== null && e.ObjectTypeCode !== undefined,
        )
        .forEach((e: any) => {
          // Handle both string and object DisplayName/LogicalName
          let name = "";
          if (typeof e.DisplayName === "string") {
            name = e.DisplayName;
          } else if (e.DisplayName && typeof e.DisplayName === "object") {
            name =
              e.DisplayName.LocalizedLabels?.[0]?.Label ||
              e.DisplayName.UserLocalizedLabel?.Label ||
              "";
          }
          if (!name) {
            if (typeof e.LogicalName === "string") {
              name = e.LogicalName;
            } else if (e.LogicalName && typeof e.LogicalName === "object") {
              name =
                e.LogicalName.LocalizedLabels?.[0]?.Label ||
                e.LogicalName.UserLocalizedLabel?.Label ||
                "";
            }
          }
          if (!name) {
            name = e.SchemaName;
          }
          if (name) merged.set(e.ObjectTypeCode as number, name);
        });
    } catch (err) {
      logger.warning(`EntityDefinitions API failed: ${(err as Error).message}`);
    }

    // Layer 3: solutioncomponentdefinitions API (highest priority, overrides all)
    // The `name` field here is the msdyn_solutioncomponentname value used in layer queries.
    const layerNameMap = new Map<number, string>();
    try {
      const url3 =
        "solutioncomponentdefinitions?$select=solutioncomponenttype,name&$orderby=name";

      const records = await loadAllData(url3);
      records
        .filter(
          (r: any) =>
            r.solutioncomponenttype !== null &&
            r.solutioncomponenttype !== undefined,
        )
        .forEach((r: any) => {
          merged.set(r.solutioncomponenttype as number, r.name as string);
          layerNameMap.set(r.solutioncomponenttype as number, r.name as string);
        });
    } catch (err) {
      logger.warning(
        `solutioncomponentdefinitions API failed: ${(err as Error).message}`,
      );
    }

    // Build layerName: solutioncomponentdefinitions (dynamic) first, COMPONENT_TYPES as fallback
    const result = Array.from(merged.entries())
      .map(([t, n]) => ({
        solutioncomponenttype: t,
        name: n,
        layerName: layerNameMap.get(t) ?? getLayerName(t),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    logger.info(
      `[RESULT] loadComponentTypeDefinitions: Loaded ${result.length} component type definitions`,
    );

    return result;
  } catch (error) {
    logger.warning(
      `Could not load component type definitions: ${(error as Error).message}. Using defaults.`,
    );
    // Convert fallback to ComponentTypeDefinition format for compatibility
    return COMPONENT_TYPES.map((c) => ({
      solutioncomponenttype: c.solutioncomponenttype,
      name: c.name,
      layerName: c.layerName,
    }));
  }
};

export const loadSolutionComponents = async (
  solutionId: string,
  componentTypeDefs: ComponentTypeDefinition[],
): Promise<SolutionComponent[]> => {
  const url = `solutioncomponents?$select=solutioncomponentid,objectid,componenttype&$filter=_solutionid_value eq ${solutionId}&$orderby=componenttype`;

  const records = await loadAllData(url);

  const result = records.map((r: any) => {
    const typeNum: number = r.componenttype;
    const def = componentTypeDefs.find(
      (d) => d.solutioncomponenttype === typeNum,
    );
    return {
      solutioncomponentid: r.solutioncomponentid,
      objectid: r.objectid,
      componenttype: typeNum,
      componenttypeName: def?.name ?? `Type ${typeNum}`,
    };
  });

  logger.info(
    `[RESULT] loadSolutionComponents: Loaded ${result.length} components for solution ${solutionId}`,
  );

  return result;
};

export const loadComponentNames = async (
  components: SolutionComponent[],
): Promise<Map<string, string>> => {
  const nameMap = new Map<string, string>();

  // Group components by their numeric type
  const groupedByType = new Map<number, SolutionComponent[]>();
  for (const comp of components) {
    const existing = groupedByType.get(comp.componenttype) ?? [];
    existing.push(comp);
    groupedByType.set(comp.componenttype, existing);
  }

  await Promise.all(
    Array.from(groupedByType.entries()).map(
      async ([typeNum, typeComponents]) => {
        const typeName = typeComponents[0]?.componenttypeName;
        if (!typeName) return;

        const typeTotal = typeComponents.length;
        let foundInLayers = 0;
        let foundInEntity = 0;

        // First: try msdyn_componentlayers for layered/customized components
        const layerQueryName = getLayerName(typeNum) ?? typeName;
        for (let i = 0; i < typeComponents.length; i += LAYER_BATCH_SIZE) {
          const batch = typeComponents.slice(i, i + LAYER_BATCH_SIZE);
          const idFilter = batch
            .map((c) => `msdyn_componentid eq '${c.objectid}'`)
            .join(" or ");
          const url =
            `msdyn_componentlayers?$select=msdyn_componentid,msdyn_name` +
            `&$filter=msdyn_solutioncomponentname eq '${encodeURIComponent(layerQueryName)}' and (${idFilter})`;
          try {
            const records = await loadAllData(url);
            for (const r of records) {
              if (
                r.msdyn_componentid &&
                r.msdyn_name &&
                !nameMap.has(r.msdyn_componentid.toLowerCase())
              ) {
                nameMap.set(r.msdyn_componentid.toLowerCase(), r.msdyn_name);
                foundInLayers++;
              }
            }
          } catch (error) {
            logger.warning(
              `Could not load layer names for type ${typeName}: ${(error as Error).message}`,
            );
          }
        }

        // Second: try the actual entity table for this component type
        const entityInfo = getEntityInfo(typeNum);
        if (entityInfo) {
          const notFoundIds = typeComponents.filter(
            (c) => !nameMap.has(c.objectid.toLowerCase()),
          );

          if (notFoundIds.length > 0) {
            for (let i = 0; i < notFoundIds.length; i += LAYER_BATCH_SIZE) {
              const batch = notFoundIds.slice(i, i + LAYER_BATCH_SIZE);
              const idFilter = batch
                .map((c) => `${entityInfo.idField} eq '${c.objectid}'`)
                .join(" or ");

              try {
                const url = `${entityInfo.tableName}?$select=${entityInfo.idField},${entityInfo.displayField}&$filter=${idFilter}`;
                const records = await loadAllData(url);
                for (const r of records) {
                  const recordId = r[entityInfo.idField];
                  const displayName = r[entityInfo.displayField];
                  if (
                    recordId &&
                    displayName &&
                    !nameMap.has(String(recordId).toLowerCase())
                  ) {
                    nameMap.set(
                      String(recordId).toLowerCase(),
                      String(displayName),
                    );
                    foundInEntity++;
                  }
                }
              } catch (error) {
                logger.warning(
                  `Could not query ${entityInfo.tableName} for type ${typeName}: ${(error as Error).message}`,
                );
              }
            }
          }
        }

        const unfound = typeTotal - foundInLayers - foundInEntity;
        logger.info(
          `${typeName}: total=${typeTotal}, msdyn_componentlayers=${foundInLayers}, ${entityInfo?.tableName || "N/A"}=${foundInEntity}, unfound=${unfound}`,
        );
      },
    ),
  );

  logger.info(
    `[RESULT] loadComponentNames: ${nameMap.size} total names resolved`,
  );

  return nameMap;
};

export const loadComponentLayers = async (
  componentId: string,
  componentType: number,
  componentTypeName: string,
): Promise<ComponentLayer[]> => {
  const layerTypeName = getLayerName(componentType) ?? componentTypeName;
  const url =
    `msdyn_componentlayers?$select=msdyn_componentlayerid,msdyn_componentid,msdyn_name,msdyn_solutionname,msdyn_solutioncomponentname,msdyn_order,msdyn_componentjson,msdyn_changes,msdyn_children` +
    `&$filter=msdyn_solutioncomponentname eq '${encodeURIComponent(layerTypeName)}' and msdyn_componentid eq '${componentId}'` +
    `&$orderby=msdyn_order`;

  logger.info(
    `[QUERY] loadComponentLayers (detail for ${componentTypeName}/${layerTypeName} id: ${componentId}): ${url}`,
  );
  const records = await loadAllData(url);

  const mapped = records.map((r: any) => ({
    msdyn_componentlayerid: r.msdyn_componentlayerid,
    msdyn_componentid: r.msdyn_componentid,
    msdyn_name: r.msdyn_name,
    msdyn_solutionname: r.msdyn_solutionname,
    msdyn_solutioncomponentname: r.msdyn_solutioncomponentname,
    msdyn_order: r.msdyn_order,
    msdyn_componentjson: r.msdyn_componentjson,
    msdyn_changes: r.msdyn_changes,
    msdyn_children: r.msdyn_children,
  }));

  logger.info(
    `[RESULT] loadComponentLayers: Loaded ${mapped.length} layers for ${componentTypeName}/${layerTypeName} id: ${componentId}`,
  );

  return mapped;
};

export const loadActiveLayersForComponents = async (
  components: SolutionComponent[],
  onProgress?: (current: number, total: number) => void,
  cancelSignal?: { cancelled: boolean },
): Promise<Map<string, ComponentLayer[]>> => {
  const layersByComponentId = new Map<string, ComponentLayer[]>();

  // msdyn_componentlayers is a virtual entity that requires BOTH msdyn_solutioncomponentname
  // AND msdyn_componentid as mandatory key fields — OR batching does not work.
  // Mirror the old C# ExecuteMultiple approach: one query per component, run in parallel.
  const PARALLEL_SIZE = 20;
  let processed = 0;
  const total = components.length;

  for (let i = 0; i < components.length; i += PARALLEL_SIZE) {
    if (cancelSignal?.cancelled) {
      logger.info(
        `[INFO] loadActiveLayersForComponents: Cancelled after ${processed}/${total}`,
      );
      break;
    }
    const chunk = components.slice(i, i + PARALLEL_SIZE);

    await Promise.all(
      chunk.map(async (comp) => {
        const typeNum = comp.componenttype;
        const layerTypeName = getLayerName(typeNum) ?? comp.componenttypeName;
        const url =
          `msdyn_componentlayers?$select=msdyn_componentlayerid,msdyn_componentid,msdyn_name,msdyn_solutionname,msdyn_solutioncomponentname,msdyn_order` +
          `&$filter=msdyn_solutioncomponentname eq '${encodeURIComponent(layerTypeName)}' and msdyn_componentid eq '${comp.objectid}'`;
        try {
          const records = await loadAllData(url);
          for (const layer of records) {
            const compId: string = layer.msdyn_componentid?.toLowerCase();
            if (!compId) continue;
            const existing = layersByComponentId.get(compId) ?? [];
            existing.push({
              msdyn_componentlayerid: layer.msdyn_componentlayerid,
              msdyn_componentid: layer.msdyn_componentid,
              msdyn_name: layer.msdyn_name,
              msdyn_solutionname: layer.msdyn_solutionname,
              msdyn_solutioncomponentname: layer.msdyn_solutioncomponentname,
              msdyn_order: layer.msdyn_order,
            });
            layersByComponentId.set(compId, existing);
          }
        } catch (error) {
          logger.warning(
            `Error loading layers for ${layerTypeName}/${comp.objectid}: ${(error as Error).message}`,
          );
        }
      }),
    );

    processed += chunk.length;
    onProgress?.(processed, total);
    logger.info(
      `[RESULT] loadActiveLayersForComponents: ${processed}/${total} components queried, ${layersByComponentId.size} with layers so far`,
    );
  }

  return layersByComponentId;
};

export const revertActiveLayer = async (
  activeLayer: ComponentLayer,
  componentType: number,
): Promise<void> => {
  // Look up entity logical name from component type definitions
  const componentDef = COMPONENT_TYPES.find(
    (c) => c.solutioncomponenttype === componentType,
  );
  const entityLogicalName = componentDef?.entityLogicalName;
  const componentId = activeLayer.msdyn_componentid;

  if (!entityLogicalName || !componentId) {
    throw new Error(
      `Cannot revert layer: missing entityLogicalName (type: ${componentType}) or componentId (${componentId})`,
    );
  }

  try {
    logger.info(
      `[DELETE] revertActiveLayer: Removing active layer for ${activeLayer.msdyn_solutioncomponentname}/${componentId}`,
    );

    // TODO: change to	mscrm.BulkRemoveActiveCustomizationsParameters later on
    const request = {
      operationName: "RemoveActiveCustomization",
      operationType: "action",
      parameters: {
        LogicalName: entityLogicalName,
        Id: componentId,
      },
    };

    await (window.dataverseAPI as any).execute(request);
    logger.info(
      `[DELETE] revertActiveLayer: success for ${activeLayer.msdyn_solutioncomponentname}/${componentId}`,
    );
  } catch (err) {
    logger.warning(
      `[DELETE] revertActiveLayer: failed — ${(err as Error).message}`,
    );
    throw err;
  }
};
