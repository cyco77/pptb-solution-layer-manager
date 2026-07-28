import React from "react";
import {
  Button,
  Checkbox,
  makeStyles,
  Spinner,
  tokens,
} from "@fluentui/react-components";
import {
  DatabaseSearchRegular,
  DeleteRegular,
  DismissRegular,
  DocumentBulletListRegular,
} from "@fluentui/react-icons";

export type ComponentTypeSummary = {
  componenttype: number;
  typeName: string;
  totalCount: number;
  activeLayerCount: number | null; // null = not yet loaded
};

interface IComponentTypesListProps {
  summaries: ComponentTypeSummary[];
  activeTypeName: string | null;
  selectedTypeNames: Set<string>;
  isLoadingLayers: boolean;
  isDeletingLayers: boolean;
  layerLoadProgress: { current: number; total: number } | null;
  onLoadLayers: () => void;
  onCancel?: () => void;
  onRemoveAll?: () => void;
  onCreateDocumentation?: () => void;
  onTypeActivate: (typeName: string) => void;
  onSelectionChange: (selectedNames: Set<string>) => void;
}

const useStyles = makeStyles({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  toolbar: {
    display: "grid",
    gridTemplateColumns: "auto 1fr 56px 56px",
    alignItems: "center",
    gap: "8px",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  toolbarLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    userSelect: "none",
  },
  toolbarHeaderCell: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textAlign: "right",
    userSelect: "none",
  },
  body: {
    overflowY: "auto",
    flex: 1,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "auto 1fr 56px 56px",
    alignItems: "center",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    cursor: "pointer",
    minHeight: "28px",
    gap: "8px",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  rowActive: {
    backgroundColor: tokens.colorBrandBackground2,
    ":hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  typeNameCell: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: tokens.fontSizeBase300,
    paddingLeft: "2px",
  },
  countCell: {
    textAlign: "right",
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    paddingRight: "8px",
  },
  activeCountCell: {
    textAlign: "right",
    fontSize: tokens.fontSizeBase300,
    paddingRight: "4px",
  },
  activeCountLoaded: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  activeCountNone: {
    color: tokens.colorNeutralForeground4,
  },
  bottomBar: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  progressText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const ComponentTypesList: React.FC<IComponentTypesListProps> = ({
  summaries,
  activeTypeName,
  selectedTypeNames,
  isLoadingLayers,
  isDeletingLayers,
  layerLoadProgress,
  onLoadLayers,
  onCancel,
  onRemoveAll,
  onCreateDocumentation,
  onTypeActivate,
  onSelectionChange,
}) => {
  const styles = useStyles();

  const layersEverLoaded = summaries.some((s) => s.activeLayerCount !== null);
  const hasAnyActiveLayers = summaries.some(
    (s) => (s.activeLayerCount ?? 0) > 0,
  );

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.toolbar}>
        <Checkbox
          checked={
            summaries.length > 0 && selectedTypeNames.size === summaries.length
          }
          onChange={(_, data) => {
            if (data.checked) {
              onSelectionChange(new Set(summaries.map((s) => s.typeName)));
            } else {
              onSelectionChange(new Set());
            }
          }}
        />
        <span className={styles.toolbarLabel}>Components</span>
        <span className={styles.toolbarHeaderCell}>Count</span>
        <span className={styles.toolbarHeaderCell}>Active</span>
      </div>

      {/* List body */}
      <div className={styles.body}>
        {summaries.map((s) => {
          const isActive = s.typeName === activeTypeName;
          const isSelected = selectedTypeNames.has(s.typeName);
          return (
            <div
              key={s.typeName}
              className={`${styles.row} ${isActive ? styles.rowActive : ""}`}
              onClick={() => {
                // Toggle selection and activate the type for viewing
                const newSelected = new Set(selectedTypeNames);
                if (selectedTypeNames.has(s.typeName)) {
                  newSelected.delete(s.typeName);
                } else {
                  newSelected.add(s.typeName);
                }
                onSelectionChange(newSelected);
                // Also activate for viewing
                onTypeActivate(s.typeName);
              }}
              style={{ cursor: "pointer" }}
            >
              <Checkbox
                checked={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle selection on checkbox click
                  const newSelected = new Set(selectedTypeNames);
                  if (selectedTypeNames.has(s.typeName)) {
                    newSelected.delete(s.typeName);
                  } else {
                    newSelected.add(s.typeName);
                  }
                  onSelectionChange(newSelected);
                }}
              />
              <span className={styles.typeNameCell} title={s.typeName}>
                {s.typeName}
              </span>
              <span className={styles.countCell}>{s.totalCount}</span>
              <span
                className={`${styles.activeCountCell} ${
                  s.activeLayerCount === null
                    ? ""
                    : s.activeLayerCount > 0
                      ? styles.activeCountLoaded
                      : styles.activeCountNone
                }`}
              >
                {s.activeLayerCount === null ? "—" : s.activeLayerCount}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        {isLoadingLayers ? (
          <>
            <Spinner size="tiny" />
            <span className={styles.progressText}>
              {layerLoadProgress
                ? `Loading ${layerLoadProgress.current}/${layerLoadProgress.total}…`
                : "Loading…"}
            </span>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onCancel}
              size="small"
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              appearance="primary"
              icon={<DatabaseSearchRegular />}
              onClick={onLoadLayers}
              size="small"
              disabled={isDeletingLayers}
            >
              {layersEverLoaded ? "Reload Active Layers" : "Load Active Layers"}
            </Button>
            {hasAnyActiveLayers && (
              <>
                <Button
                  appearance="subtle"
                  icon={<DeleteRegular />}
                  onClick={onRemoveAll}
                  size="small"
                  style={{ color: tokens.colorPaletteRedForeground1 }}
                  title="Remove all active layers"
                  disabled={isDeletingLayers}
                />
                <Button
                  appearance="subtle"
                  icon={<DocumentBulletListRegular />}
                  onClick={onCreateDocumentation}
                  size="small"
                  title="Create documentation"
                  disabled={isDeletingLayers}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
