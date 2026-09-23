import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Button,
  makeStyles,
  Spinner,
  Text,
  tokens,
} from "@fluentui/react-components";
import { DocumentBulletListRegular } from "@fluentui/react-icons";
import { Filter } from "./Filter";
import { ComponentTypesList, ComponentTypeSummary } from "./ComponentTypesList";
import { ActiveLayersTree } from "./ActiveLayersTree";
import { LayersPanel } from "./LayersPanel";
import { DeletionProgressModal } from "./DeletionProgressModal";
import { logger } from "../services/loggerService";
import {
  loadSolutions,
  loadComponentTypeDefinitions,
  loadSolutionComponents,
  loadComponentNames,
  loadComponentLayers,
  loadActiveLayersForComponents,
  bulkRevertActiveLayers,
} from "../services/dataverseService";
import { Solution } from "../types/solution";
import {
  ComponentTypeDefinition,
  ComponentWithLayers,
} from "../types/solutionComponent";
import { ComponentLayer } from "../types/componentLayer";
import { ManagedFilter } from "../types/solutionFilters";

interface IOverviewProps {
  connection: ToolBoxAPI.DataverseConnection | null;
}

const useStyles = makeStyles({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  },
  filterBar: {
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "12px",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    overflow: "hidden",
    minHeight: 0,
  },
  leftPanel: {
    width: "320px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  centerMessage: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
});

export const Overview: React.FC<IOverviewProps> = ({ connection }) => {
  const styles = useStyles();

  // Solutions
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const [managedFilter, setManagedFilter] = useState<ManagedFilter>("managed");

  // Component type definitions
  const [componentTypeDefs, setComponentTypeDefs] = useState<
    ComponentTypeDefinition[]
  >([]);

  // All components for selected solution
  const [selectedSolutionIds, setSelectedSolutionIds] = useState<string[]>([]);
  const [selectedPublisherNames, setSelectedPublisherNames] = useState<
    string[]
  >([]);
  const [allComponents, setAllComponents] = useState<ComponentWithLayers[]>([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);

  // Left panel state
  const [activeTypeName, setActiveTypeName] = useState<string | null>(null);
  const [selectedTypeNames, setSelectedTypeNames] = useState<Set<string>>(
    new Set(),
  );

  // Layer loading
  const [isLoadingLayers, setIsLoadingLayers] = useState(false);
  const [layerLoadProgress, setLayerLoadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [activeLayersLoaded, setActiveLayersLoaded] = useState(false);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const metadataLoadingRef = useRef<Promise<ComponentTypeDefinition[]>>();

  const resetComponentSelection = useCallback(() => {
    setAllComponents([]);
    setActiveTypeName(null);
    setSelectedTypeNames(new Set());
    setSelectedComponentId(null);
    setIsLayersPanelOpen(false);
    setActiveLayersLoaded(false);
  }, []);

  // Layer deletion
  const [isDeletingLayers, setIsDeletingLayers] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Right panel: selected component & drawer
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [detailLayers, setDetailLayers] = useState<ComponentLayer[]>([]);
  const [isLoadingDetailLayers, setIsLoadingDetailLayers] = useState(false);

  // ---- Load component type definitions and solutions in parallel on connection ----
  useEffect(() => {
    if (!connection) return;

    setSelectedPublisherNames([]);
    setSelectedSolutionIds([]);
    resetComponentSelection();

    // Load metadata
    metadataLoadingRef.current = loadComponentTypeDefinitions()
      .then((defs) => {
        setComponentTypeDefs(defs);
        return defs;
      })
      .catch((error) => {
        logger.error(`Metadata loading failed: ${(error as Error).message}`);
        throw error;
      });

    // Load solutions in parallel (don't wait for metadata)
    const loadSols = async () => {
      try {
        setIsLoadingSolutions(true);
        const sols = await loadSolutions(managedFilter);
        setSolutions(sols);
      } catch (error) {
        logger.error(`Error loading solutions: ${(error as Error).message}`);
        await window.toolboxAPI.utils.showNotification({
          title: "Error Loading Solutions",
          body: `Failed to load solutions: ${(error as Error).message}`,
          type: "error",
        });
      } finally {
        setIsLoadingSolutions(false);
      }
    };

    loadSols();
  }, [connection, managedFilter, resetComponentSelection]);

  // ---- Reload solutions (for manual refresh via Filter) ----
  const handleReloadSolutions = useCallback(async () => {
    if (!connection) return;
    try {
      setSelectedPublisherNames([]);
      setSelectedSolutionIds([]);
      resetComponentSelection();
      setIsLoadingSolutions(true);
      const sols = await loadSolutions(managedFilter);
      setSolutions(sols);
    } catch (error) {
      logger.error(`Error loading solutions: ${(error as Error).message}`);
      await window.toolboxAPI.utils.showNotification({
        title: "Error Loading Solutions",
        body: `Failed to load solutions: ${(error as Error).message}`,
        type: "error",
      });
    } finally {
      setIsLoadingSolutions(false);
    }
  }, [connection, managedFilter, resetComponentSelection]);

  // ---- Load solution components for the selected publisher/solution filters ----
  const handleLoadSolutionComponents = useCallback(
    async (solutionIds: string[]) => {
      resetComponentSelection();

      if (solutionIds.length === 0) return;

      // Wait for metadata to be ready if still loading
      if (metadataLoadingRef.current) {
        try {
          await metadataLoadingRef.current;
        } catch (error) {
          logger.error(`Metadata loading failed: ${(error as Error).message}`);
          await window.toolboxAPI.utils.showNotification({
            title: "Error Loading Metadata",
            body: `Failed to load component metadata: ${(error as Error).message}`,
            type: "error",
          });
          return;
        }
      }

      try {
        setIsLoadingComponents(true);
        const comps = await loadSolutionComponents(
          solutionIds,
          componentTypeDefs,
          solutions,
        );
        const withLayers: ComponentWithLayers[] = comps.map((c) => ({
          ...c,
          layers: null,
        }));
        setAllComponents(withLayers);

        // Load names in background
        loadComponentNames(comps)
          .then((nameMap) => {
            setAllComponents((prev) =>
              prev.map((c) => ({
                ...c,
                name:
                  nameMap.get(c.objectid.toLowerCase()) ??
                  nameMap.get(c.objectid) ??
                  c.name,
              })),
            );
          })
          .catch((err) =>
            logger.warning(
              `Could not load component names: ${(err as Error).message}`,
            ),
          );
      } catch (error) {
        logger.error(`Error loading components: ${(error as Error).message}`);
        await window.toolboxAPI.utils.showNotification({
          title: "Error Loading Components",
          body: `Failed to load components: ${(error as Error).message}`,
          type: "error",
        });
      } finally {
        setIsLoadingComponents(false);
      }
    },
    [componentTypeDefs, resetComponentSelection, solutions],
  );

  const handlePublisherChanged = useCallback(
    (publisherNames: string[]) => {
      setSelectedPublisherNames(publisherNames);
      const matchingSolutionIds = solutions
        .filter((solution) =>
          publisherNames.includes(solution.publisherName ?? ""),
        )
        .map((solution) => solution.solutionid);
      setSelectedSolutionIds(matchingSolutionIds);
      void handleLoadSolutionComponents(matchingSolutionIds);
    },
    [handleLoadSolutionComponents, solutions],
  );

  const handleSolutionsChanged = useCallback(
    (solutionIds: string[]) => {
      const effectiveSolutionIds =
        solutionIds.length > 0
          ? solutionIds
          : solutions
              .filter((solution) =>
                selectedPublisherNames.includes(solution.publisherName ?? ""),
              )
              .map((solution) => solution.solutionid);
      setSelectedSolutionIds(effectiveSolutionIds);
      void handleLoadSolutionComponents(effectiveSolutionIds);
    },
    [handleLoadSolutionComponents, selectedPublisherNames, solutions],
  );

  // ---- Load active layers for selected component types ----
  const handleLoadActiveLayers = useCallback(async () => {
    if (selectedTypeNames.size === 0) {
      await window.toolboxAPI.utils.showNotification({
        title: "No Selection",
        body: "Please select at least one component type to load layers for.",
        type: "warning",
      });
      return;
    }

    const targetComponents = allComponents.filter((c) =>
      selectedTypeNames.has(c.componenttypeName),
    );
    if (targetComponents.length === 0) return;

    try {
      setIsLoadingLayers(true);
      setLayerLoadProgress({ current: 0, total: targetComponents.length });
      cancelRef.current = { cancelled: false };

      const layerMap = await loadActiveLayersForComponents(
        targetComponents,
        (current, total) => setLayerLoadProgress({ current, total }),
        cancelRef.current,
      );

      setAllComponents((prev) =>
        prev.map((c) => {
          const layers =
            layerMap.get(c.objectid.toLowerCase()) ??
            layerMap.get(c.objectid) ??
            [];
          const activeLayers = layers.filter(
            (layer) => layer.msdyn_solutionname?.toLowerCase() === "active",
          );
          return {
            ...c,
            layers: activeLayers.length > 0 ? activeLayers : null,
          };
        }),
      );
      setActiveLayersLoaded(true);
    } catch (error) {
      logger.error(`Error loading active layers: ${(error as Error).message}`);
      await window.toolboxAPI.utils.showNotification({
        title: "Error Loading Layers",
        body: `Failed to load active layers: ${(error as Error).message}`,
        type: "error",
      });
    } finally {
      setIsLoadingLayers(false);
      setLayerLoadProgress(null);
    }
  }, [allComponents, selectedTypeNames]);

  const handleCancelLoadLayers = useCallback(() => {
    cancelRef.current.cancelled = true;
    setIsLoadingLayers(false);
    setLayerLoadProgress(null);
  }, []);

  const handleDeleteSelectedLayers = useCallback(
    async (selected: ComponentWithLayers[]) => {
      if (selected.length === 0) return;
      if (
        !window.confirm(
          `Remove active layers from ${selected.length} selected component(s)?\nThis cannot be undone.`,
        )
      )
        return;

      setIsDeletingLayers(true);
      setDeletionProgress({ current: selected.length, total: selected.length });

      try {
        await bulkRevertActiveLayers(
          selected.map((comp) => ({
            componentType: comp.componenttype,
            componentId: comp.objectid,
            componentTypeName: comp.componenttypeName,
          })),
        );

        setAllComponents((prev) =>
          prev.map((c) =>
            selected.some(
              (selectedComp) =>
                selectedComp.solutioncomponentid === c.solutioncomponentid,
            )
              ? { ...c, layers: null }
              : c,
          ),
        );

        await window.toolboxAPI.utils.showNotification({
          title: "Active Layers Removal",
          body: `Successfully removed ${selected.length} active layer(s).`,
          type: "info",
        });
      } catch (error) {
        await window.toolboxAPI.utils.showNotification({
          title: "Active Layers Removal",
          body: `Failed to remove active layers: ${(error as Error).message}`,
          type: "error",
        });
      } finally {
        setIsDeletingLayers(false);
        setDeletionProgress(null);
      }
    },
    [],
  );

  const handleCreateDocumentation = useCallback(() => {
    const solutionName =
      solutions
        .filter((s) => selectedSolutionIds.includes(s.solutionid))
        .map((solution) => solution.friendlyname)
        .join(", ") || "Unknown";
    const date = new Date().toISOString().split("T")[0];
    const activeComps = allComponents.filter(
      (c) => c.layers !== null && c.layers.length > 0,
    );
    const byType = new Map<string, ComponentWithLayers[]>();
    for (const c of activeComps) {
      const existing = byType.get(c.componenttypeName) ?? [];
      existing.push(c);
      byType.set(c.componenttypeName, existing);
    }
    const lines: string[] = [
      `# Active Layer Report`,
      ``,
      `**Solution:** ${solutionName}`,
      `**Generated:** ${date}`,
      ``,
      `## Summary`,
      ``,
      `- Total components inspected: ${allComponents.length}`,
      `- Components with active layer: ${activeComps.length}`,
      ``,
      `## Active Layer Components`,
      ``,
    ];
    for (const [typeName, comps] of Array.from(byType.entries()).sort(
      ([a], [b]) => a.localeCompare(b),
    )) {
      lines.push(`### ${typeName} (${comps.length})`);
      lines.push(``);
      lines.push(`| Name | Component ID | Layers |`);
      lines.push(`|------|-------------|--------|`);
      for (const c of comps) {
        const name = c.name ?? c.layers?.[0]?.msdyn_name ?? c.objectid;
        lines.push(
          `| ${name} | \`${c.objectid}\` | ${c.layers?.length ?? 0} |`,
        );
      }
      lines.push(``);
    }
    const markdown = lines.join("\n");
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `active-layers-${solutionName.replace(/[^a-zA-Z0-9]/g, "-")}-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [allComponents, solutions, selectedSolutionIds]);

  // ---- Select component → load detail layers ----
  const handleSelectionChange = useCallback(
    async (id: string | null) => {
      setSelectedComponentId(id);
      if (!id) {
        setIsLayersPanelOpen(false);
        return;
      }

      const comp = allComponents.find((c) => c.solutioncomponentid === id);
      if (!comp) return;

      setIsLayersPanelOpen(true);
      setIsLoadingDetailLayers(true);
      setDetailLayers([]);

      try {
        const layers = await loadComponentLayers(
          comp.objectid,
          comp.componenttype,
          comp.componenttypeName,
        );
        setDetailLayers(layers);
      } catch (error) {
        logger.error(`Error loading layers: ${(error as Error).message}`);
        await window.toolboxAPI.utils.showNotification({
          title: "Error",
          body: `Failed to load layers: ${(error as Error).message}`,
          type: "error",
        });
      } finally {
        setIsLoadingDetailLayers(false);
      }
    },
    [allComponents],
  );

  // ---- Type summaries for left panel ----
  const typeSummaries = useMemo<ComponentTypeSummary[]>(() => {
    const map = new Map<
      string,
      {
        componenttype: number;
        totalCount: number;
        activeLayerCount: number | null;
      }
    >();

    for (const c of allComponents) {
      if (!map.has(c.componenttypeName)) {
        map.set(c.componenttypeName, {
          componenttype: c.componenttype,
          totalCount: 0,
          activeLayerCount: activeLayersLoaded ? 0 : null,
        });
      }
      const entry = map.get(c.componenttypeName)!;
      entry.totalCount += 1;
      if (activeLayersLoaded && c.layers !== null) {
        entry.activeLayerCount = (entry.activeLayerCount ?? 0) + 1;
      }
    }

    return Array.from(map.entries())
      .map(([typeName, v]) => ({ typeName, ...v }))
      .sort((a, b) => a.typeName.localeCompare(b.typeName));
  }, [allComponents, activeLayersLoaded]);

  // ---- Active layers grouped by their solution component type ----
  const componentGroups = useMemo(() => {
    if (!activeLayersLoaded) return [];
    return [...selectedTypeNames]
      .sort((a, b) => a.localeCompare(b))
      .map((typeName) => ({
        typeName,
        components: allComponents.filter(
          (component) =>
            component.componenttypeName === typeName &&
            component.layers !== null,
        ),
      }))
      .filter((group) => group.components.length > 0);
  }, [allComponents, activeLayersLoaded, selectedTypeNames]);

  const selectedComponent =
    allComponents.find((c) => c.solutioncomponentid === selectedComponentId) ??
    null;

  return (
    <div className={styles.root}>
      {/* Top: solution filter */}
      <div className={styles.filterBar}>
        <Filter
          solutions={solutions}
          selectedPublisherNames={selectedPublisherNames}
          selectedSolutionIds={selectedSolutionIds}
          managedFilter={managedFilter}
          isLoadingSolutions={isLoadingSolutions}
          isDeletingLayers={isDeletingLayers}
          onPublisherChanged={handlePublisherChanged}
          onSolutionsChanged={handleSolutionsChanged}
          onManagedFilterChanged={setManagedFilter}
          onReloadSolutions={handleReloadSolutions}
        />
        {activeLayersLoaded &&
          allComponents.some(
            (component) =>
              component.layers !== null && component.layers.length > 0,
          ) && (
            <Button
              appearance="subtle"
              icon={<DocumentBulletListRegular />}
              onClick={handleCreateDocumentation}
              disabled={isDeletingLayers}
            >
              Export active layers
            </Button>
          )}
      </div>

      {/* Content: left type list + right components grid */}
      <div className={styles.content}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          {isLoadingComponents ? (
            <div className={styles.centerMessage}>
              <Spinner label="Loading components…" />
            </div>
          ) : selectedSolutionIds.length === 0 ? (
            <div className={styles.centerMessage}>
              <Text>
                Select one or more solutions above to load their components.
              </Text>
            </div>
          ) : typeSummaries.length === 0 ? (
            <div className={styles.centerMessage}>
              <Text>No components found.</Text>
            </div>
          ) : (
            <ComponentTypesList
              summaries={typeSummaries}
              activeTypeName={activeTypeName}
              selectedTypeNames={selectedTypeNames}
              isLoadingLayers={isLoadingLayers}
              isDeletingLayers={isDeletingLayers}
              layerLoadProgress={layerLoadProgress}
              onLoadLayers={handleLoadActiveLayers}
              onCancel={handleCancelLoadLayers}
              onTypeActivate={(typeName) => {
                setActiveTypeName(typeName);
                setSelectedComponentId(null);
                setIsLayersPanelOpen(false);
              }}
              onSelectionChange={setSelectedTypeNames}
            />
          )}
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          {selectedTypeNames.size === 0 ? (
            <div className={styles.centerMessage}>
              <Text>
                {selectedSolutionIds.length > 0
                  ? "Select one or more solution components on the left."
                  : "Select one or more solutions to get started."}
              </Text>
            </div>
          ) : !activeLayersLoaded ? (
            <div className={styles.centerMessage}>
              <Text>Load active layers to see components.</Text>
            </div>
          ) : componentGroups.length === 0 ? (
            <div className={styles.centerMessage}>
              <Text>
                No active layers found for the selected solution components.
              </Text>
            </div>
          ) : (
            <ActiveLayersTree
              groups={componentGroups}
              isDeletingLayers={isDeletingLayers}
              onOpenDetails={handleSelectionChange}
              onDeleteSelected={handleDeleteSelectedLayers}
            />
          )}
        </div>
      </div>

      <LayersPanel
        open={isLayersPanelOpen}
        component={selectedComponent}
        layers={detailLayers}
        isLoading={isLoadingDetailLayers}
        onOpenChange={setIsLayersPanelOpen}
      />

      {isDeletingLayers && deletionProgress && (
        <DeletionProgressModal
          current={deletionProgress.current}
          total={deletionProgress.total}
        />
      )}
    </div>
  );
};
