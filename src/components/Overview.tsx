import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { makeStyles, Spinner, Text, tokens } from "@fluentui/react-components";
import { Filter } from "./Filter";
import { ComponentTypesList, ComponentTypeSummary } from "./ComponentTypesList";
import { DataGridView } from "./DataGridView";
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
  revertActiveLayer,
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
  const [managedFilter, setManagedFilter] =
    useState<ManagedFilter>("managed");
  const [includeHidden, setIncludeHidden] = useState(false);

  // Component type definitions
  const [componentTypeDefs, setComponentTypeDefs] = useState<
    ComponentTypeDefinition[]
  >([]);

  // All components for selected solution
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(
    null,
  );
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
        const sols = await loadSolutions(managedFilter, includeHidden);
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
  }, [connection, managedFilter, includeHidden]);

  // ---- Reload solutions (for manual refresh via Filter) ----
  const handleReloadSolutions = useCallback(async () => {
    if (!connection) return;
    try {
      setIsLoadingSolutions(true);
      const sols = await loadSolutions(managedFilter, includeHidden);
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
  }, [connection, managedFilter, includeHidden]);

  // ---- Select solution → load component stubs ----
  const handleSolutionChanged = useCallback(
    async (solutionId: string | null) => {
      setSelectedSolutionId(solutionId);
      setAllComponents([]);
      setActiveTypeName(null);
      setSelectedTypeNames(new Set());
      setSelectedComponentId(null);
      setIsLayersPanelOpen(false);
      setActiveLayersLoaded(false);

      if (!solutionId) return;

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
          solutionId,
          componentTypeDefs,
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
    [componentTypeDefs],
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
          const hasActive = layers.some(
            (l) => l.msdyn_solutionname?.toLowerCase() === "active",
          );
          return { ...c, layers: hasActive ? layers : null };
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

  const handleRemoveAllActiveLayers = useCallback(async () => {
    const activeComps = allComponents.filter(
      (c) => c.layers !== null && c.layers.length > 0,
    );
    if (activeComps.length === 0) return;
    if (
      !window.confirm(
        `Remove active layers from ${activeComps.length} component(s)?\nThis cannot be undone.`,
      )
    )
      return;

    setIsDeletingLayers(true);
    setDeletionProgress({ current: 0, total: activeComps.length });

    const successfullyRemovedIds = new Set<string>();
    const errors: string[] = [];

    for (let i = 0; i < activeComps.length; i++) {
      const comp = activeComps[i];
      try {
        const layer = comp.layers?.find(
          (l) => l.msdyn_solutionname?.toLowerCase() === "active",
        );
        if (!layer) {
          errors.push(`${comp.name || comp.objectid}: No active layer found`);
          setDeletionProgress({ current: i + 1, total: activeComps.length });
          continue;
        }
        await revertActiveLayer(layer, comp.componenttype);
        successfullyRemovedIds.add(comp.solutioncomponentid);
      } catch (err) {
        errors.push(`${comp.name || comp.objectid}: ${(err as Error).message}`);
      }
      setDeletionProgress({ current: i + 1, total: activeComps.length });
    }

    // Only remove successfully deleted components from UI
    setAllComponents((prev) =>
      prev.map((c) =>
        successfullyRemovedIds.has(c.solutioncomponentid)
          ? { ...c, layers: null }
          : c,
      ),
    );
    setActiveLayersLoaded(false);
    setIsDeletingLayers(false);
    setDeletionProgress(null);

    const successCount = successfullyRemovedIds.size;
    const errorCount = errors.length;

    await window.toolboxAPI.utils.showNotification({
      title: "Active Layers Removal",
      body:
        successCount > 0 && errorCount === 0
          ? `Successfully removed ${successCount} active layer(s).`
          : successCount > 0 && errorCount > 0
            ? `Removed: ${successCount}\nErrors: ${errorCount}\n\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? "\n..." : ""}`
            : `Failed to remove any layers.\n\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? "\n..." : ""}`,
      type: successCount > 0 ? "info" : "error",
    });
  }, [allComponents]);

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
      setDeletionProgress({ current: 0, total: selected.length });

      const successfullyRemovedIds = new Set<string>();
      const errors: string[] = [];

      for (let i = 0; i < selected.length; i++) {
        const comp = selected[i];
        try {
          const layer = comp.layers?.find(
            (l) => l.msdyn_solutionname?.toLowerCase() === "active",
          );
          if (!layer) {
            errors.push(`${comp.name || comp.objectid}: No active layer found`);
            setDeletionProgress({ current: i + 1, total: selected.length });
            continue;
          }
          await revertActiveLayer(layer, comp.componenttype);
          successfullyRemovedIds.add(comp.solutioncomponentid);
        } catch (err) {
          errors.push(
            `${comp.name || comp.objectid}: ${(err as Error).message}`,
          );
        }
        setDeletionProgress({ current: i + 1, total: selected.length });
      }

      // Only remove successfully deleted components from UI
      setAllComponents((prev) =>
        prev.map((c) =>
          successfullyRemovedIds.has(c.solutioncomponentid)
            ? { ...c, layers: null }
            : c,
        ),
      );
      setIsDeletingLayers(false);
      setDeletionProgress(null);

      const successCount = successfullyRemovedIds.size;
      const errorCount = errors.length;

      await window.toolboxAPI.utils.showNotification({
        title: "Active Layers Removal",
        body:
          successCount > 0 && errorCount === 0
            ? `Successfully removed ${successCount} active layer(s).`
            : successCount > 0 && errorCount > 0
              ? `Removed: ${successCount}\nErrors: ${errorCount}\n\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? "\n..." : ""}`
              : `Failed to remove any layers.\n\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? "\n..." : ""}`,
        type: successCount > 0 ? "info" : "error",
      });
    },
    [],
  );

  const handleCreateDocumentation = useCallback(() => {
    const solutionName =
      solutions.find((s) => s.solutionid === selectedSolutionId)
        ?.friendlyname ??
      selectedSolutionId ??
      "Unknown";
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
  }, [allComponents, solutions, selectedSolutionId]);

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

  // ---- Components shown in right panel ----
  const rightPanelComponents = useMemo<ComponentWithLayers[]>(() => {
    if (!activeTypeName || !activeLayersLoaded) return [];
    return allComponents.filter(
      (c) => c.componenttypeName === activeTypeName && c.layers !== null,
    );
  }, [allComponents, activeTypeName, activeLayersLoaded]);

  const selectedComponent =
    allComponents.find((c) => c.solutioncomponentid === selectedComponentId) ??
    null;

  return (
    <div className={styles.root}>
      {/* Top: solution filter */}
      <div className={styles.filterBar}>
        <Filter
          solutions={solutions}
          selectedSolutionId={selectedSolutionId}
          managedFilter={managedFilter}
          includeHidden={includeHidden}
          isLoadingSolutions={isLoadingSolutions}
          isDeletingLayers={isDeletingLayers}
          onSolutionChanged={handleSolutionChanged}
          onManagedFilterChanged={setManagedFilter}
          onIncludeHiddenChanged={(v) => setIncludeHidden(v)}
          onReloadSolutions={handleReloadSolutions}
        />
      </div>

      {/* Content: left type list + right components grid */}
      <div className={styles.content}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          {isLoadingComponents ? (
            <div className={styles.centerMessage}>
              <Spinner label="Loading components…" />
            </div>
          ) : !selectedSolutionId ? (
            <div className={styles.centerMessage}>
              <Text>Select a solution above.</Text>
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
              onRemoveAll={handleRemoveAllActiveLayers}
              onCreateDocumentation={handleCreateDocumentation}
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
          {!activeTypeName ? (
            <div className={styles.centerMessage}>
              <Text>
                {selectedSolutionId
                  ? "Select a component type on the left to view its components."
                  : "Select a solution to get started."}
              </Text>
            </div>
          ) : !activeLayersLoaded ? (
            <div className={styles.centerMessage}>
              <Text>Load active layers to see components.</Text>
            </div>
          ) : (
            <DataGridView
              components={rightPanelComponents}
              typeName={activeTypeName}
              selectedId={selectedComponentId}
              onSelectionChange={handleSelectionChange}
              isDeletingLayers={isDeletingLayers}
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
