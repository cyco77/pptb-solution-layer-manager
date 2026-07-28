import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  makeStyles,
  SearchBox,
  SearchBoxChangeEvent,
  TableColumnDefinition,
  Text,
  tokens,
  createTableColumn,
  type DataGridProps,
  type OnSelectionChangeData,
} from "@fluentui/react-components";
import { ChevronRightRegular, DeleteRegular } from "@fluentui/react-icons";
import { ComponentWithLayers } from "../types/solutionComponent";

interface IDataGridViewProps {
  components: ComponentWithLayers[];
  typeName?: string;
  selectedId: string | null;
  isDeletingLayers?: boolean;
  onSelectionChange: (id: string | null) => void;
  onDeleteSelected?: (components: ComponentWithLayers[]) => void;
}

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  typeName: {
    fontWeight: tokens.fontWeightSemibold,
    flex: 1,
  },
  searchBox: {
    minWidth: "220px",
  },
  dataGrid: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  dataGridBody: {
    overflowY: "auto",
    flex: 1,
  },
  cell: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  activeLayerBadge: {
    flexShrink: 0,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground3,
    minHeight: "32px",
  },
  footerCount: {
    flex: 1,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const DataGridView: React.FC<IDataGridViewProps> = ({
  components,
  typeName,
  isDeletingLayers = false,
  onSelectionChange,
  onDeleteSelected,
}) => {
  const styles = useStyles();
  const [search, setSearch] = useState("");
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const prevSelectedRef = useRef<Set<string>>(new Set());

  // Reset multi-select when the component list changes (e.g. switching types)
  useEffect(() => {
    setMultiSelectedIds(new Set());
    prevSelectedRef.current = new Set();
  }, [components]);

  const filtered = useMemo(() => {
    if (!search.trim()) return components;
    const lower = search.toLowerCase();
    return components.filter((c) => {
      const name = c.name ?? c.layers?.[0]?.msdyn_name ?? c.objectid;
      return (
        name.toLowerCase().includes(lower) ||
        c.objectid.toLowerCase().includes(lower)
      );
    });
  }, [components, search]);

  const selectedItems = useMemo(
    () => new Set(multiSelectedIds),
    [multiSelectedIds],
  );

  const handleSelectionChange: DataGridProps["onSelectionChange"] = (
    _e,
    data: OnSelectionChangeData,
  ) => {
    // Only update multi-select state — drawer is opened exclusively via the Details button
    const newSet = new Set(Array.from(data.selectedItems).map(String));
    setMultiSelectedIds(newSet);
    prevSelectedRef.current = newSet;
  };

  const columns: TableColumnDefinition<ComponentWithLayers>[] = [
    createTableColumn<ComponentWithLayers>({
      columnId: "name",
      compare: (a, b) => {
        const aName = getComponentName(a);
        const bName = getComponentName(b);
        return aName.localeCompare(bName);
      },
      renderHeaderCell: () => "Component Name",
      renderCell: (item) => {
        const name = getComponentName(item);
        return (
          <span className={styles.cell} title={name}>
            {name}
          </span>
        );
      },
    }),
    createTableColumn<ComponentWithLayers>({
      columnId: "componentType",
      compare: (a, b) => a.componenttypeName.localeCompare(b.componenttypeName),
      renderHeaderCell: () => "Type",
      renderCell: (item) => (
        <span className={styles.cell} title={item.componenttypeName}>
          {item.componenttypeName}
        </span>
      ),
    }),
    createTableColumn<ComponentWithLayers>({
      columnId: "layerCount",
      compare: (a, b) => (a.layers?.length ?? -1) - (b.layers?.length ?? -1),
      renderHeaderCell: () => "Layers",
      renderCell: (item) => {
        if (item.layers === null) return <span className={styles.cell}>—</span>;
        return (
          <span
            className={styles.cell}
            title={`${item.layers.length} layer(s)`}
          >
            {item.layers.length}
          </span>
        );
      },
    }),
    createTableColumn<ComponentWithLayers>({
      columnId: "activeLayer",
      compare: (a, b) => {
        const aHas = hasActiveLayer(a) ? 1 : 0;
        const bHas = hasActiveLayer(b) ? 1 : 0;
        return bHas - aHas;
      },
      renderHeaderCell: () => "Active Layer",
      renderCell: (item) => {
        if (item.layers === null) return null;
        if (hasActiveLayer(item)) {
          return (
            <Badge
              className={styles.activeLayerBadge}
              color="warning"
              appearance="filled"
              shape="rounded"
            >
              Active
            </Badge>
          );
        }
        return null;
      },
    }),
    createTableColumn<ComponentWithLayers>({
      columnId: "details",
      compare: () => 0,
      renderHeaderCell: () => "",
      renderCell: (item) => (
        <Button
          appearance="subtle"
          icon={<ChevronRightRegular />}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSelectionChange(item.solutioncomponentid);
          }}
          title="Show layers"
        />
      ),
    }),
  ];

  const columnSizingOptions = {
    name: { minWidth: 200, defaultWidth: 320 },
    layerCount: { minWidth: 80, defaultWidth: 80 },
    activeLayer: { minWidth: 100, defaultWidth: 110 },
    details: { minWidth: 44, defaultWidth: 44 },
  };

  // Remove componentType column when showing a single type
  const visibleColumns = typeName
    ? columns.filter((c) => c.columnId !== "componentType")
    : columns;

  return (
    <div className={styles.container}>
      {/* Top bar with title and search */}
      <div className={styles.topBar}>
        <Text className={styles.typeName}>{typeName ?? "All components"}</Text>
        <SearchBox
          placeholder="Search…"
          value={search}
          onChange={(_e: SearchBoxChangeEvent, d: { value: string }) =>
            setSearch(d.value)
          }
          className={styles.searchBox}
          size="small"
        />
      </div>
      <DataGrid
        items={filtered}
        columns={visibleColumns}
        sortable
        selectionMode="multiselect"
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        getRowId={(item) => item.solutioncomponentid}
        resizableColumns
        columnSizingOptions={columnSizingOptions}
        className={styles.dataGrid}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<ComponentWithLayers> className={styles.dataGridBody}>
          {({ item, rowId }) => (
            <DataGridRow<ComponentWithLayers>
              key={rowId}
              onClick={(e: React.MouseEvent) => {
                // Toggle selection when clicking on the row (but not on action buttons)
                if ((e.target as HTMLElement).closest("button")) {
                  return; // Don't toggle if clicking on a button
                }
                const newIds = new Set(multiSelectedIds);
                const componentId = item.solutioncomponentid;
                if (newIds.has(componentId)) {
                  newIds.delete(componentId);
                } else {
                  newIds.add(componentId);
                }
                setMultiSelectedIds(newIds);
                prevSelectedRef.current = newIds;
              }}
              style={{ cursor: "pointer" }}
            >
              {({ renderCell }) => (
                <DataGridCell>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>

      {/* Footer: selection count + delete */}
      <div className={styles.footer}>
        <span className={styles.footerCount}>
          {multiSelectedIds.size > 0
            ? `${multiSelectedIds.size} selected / ${filtered.length}`
            : `0 / ${filtered.length}`}
        </span>
        {multiSelectedIds.size > 0 && !isDeletingLayers && (
          <Button
            appearance="subtle"
            icon={<DeleteRegular />}
            size="small"
            style={{ color: tokens.colorPaletteRedForeground1 }}
            onClick={() => {
              const selectedComps = filtered.filter((c) =>
                multiSelectedIds.has(c.solutioncomponentid),
              );
              onDeleteSelected?.(selectedComps);
            }}
            disabled={isDeletingLayers}
          >
            Delete ({multiSelectedIds.size})
          </Button>
        )}
      </div>
    </div>
  );
};

function getComponentName(item: ComponentWithLayers): string {
  if (item.name) return item.name;
  if (item.layers !== null && item.layers.length > 0) {
    return item.layers[0].msdyn_name ?? item.objectid;
  }
  return item.objectid;
}

function hasActiveLayer(item: ComponentWithLayers): boolean {
  return (
    item.layers?.some(
      (l) => l.msdyn_solutionname?.toLowerCase() === "active",
    ) ?? false
  );
}
