import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  makeStyles,
  OverlayDrawer,
  Spinner,
  Tab,
  TabList,
  Text,
  tokens,
} from "@fluentui/react-components";
import { DismissRegular, LayerRegular } from "@fluentui/react-icons";
import { ComponentWithLayers } from "../types/solutionComponent";
import { ComponentLayer } from "../types/componentLayer";
import { LayerDetailsViewer } from "./LayerDetailsViewer";

interface ILayersPanelProps {
  open: boolean;
  component: ComponentWithLayers | null;
  layers: ComponentLayer[];
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
}

const useStyles = makeStyles({
  drawerRoot: {
    width: "60vw",
    maxWidth: "900px",
  },
  drawerBody: {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    gap: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalL,
  },
  layerList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    overflowY: "auto",
    flex: "0 0 auto",
  },
  layerCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  layerCardActive: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  layerCardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `2px solid ${tokens.colorBrandStroke1}`,
  },
  layerOrder: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    minWidth: "24px",
    textAlign: "center",
  },
  layerName: {
    fontWeight: tokens.fontWeightSemibold,
    flex: 1,
  },
  jsonSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  tabContent: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    paddingTop: tokens.spacingVerticalS,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    flex: 1,
  },
});

export const LayersPanel: React.FC<ILayersPanelProps> = ({
  open,
  component,
  layers,
  isLoading,
  onOpenChange,
}) => {
  const styles = useStyles();
  const [selectedLayer, setSelectedLayer] = useState<ComponentLayer | null>(
    null,
  );
  const [selectedTab, setSelectedTab] = useState<string>("properties");

  const activeLayer =
    layers.find((l) => l.msdyn_solutionname?.toLowerCase() === "active") ??
    null;

  const getAvailableTabs = (layer: ComponentLayer | null) => {
    if (!layer) return [] as string[];

    const tabs: string[] = [];

    if (layer.msdyn_componentjson) tabs.push("properties");
    if (layer.msdyn_changes) tabs.push("changes");
    if (layer.msdyn_children) tabs.push("children");

    return tabs;
  };

  const handleLayerSelect = (layer: ComponentLayer) => {
    setSelectedLayer(layer);
  };

  const currentLayer = selectedLayer ?? activeLayer ?? layers[0] ?? null;

  useEffect(() => {
    const availableTabs = getAvailableTabs(currentLayer);

    if (availableTabs.length > 0 && !availableTabs.includes(selectedTab)) {
      setSelectedTab(availableTabs[0]);
    }
  }, [currentLayer, selectedTab]);

  return (
    <OverlayDrawer
      open={open}
      position="end"
      className={styles.drawerRoot}
      onOpenChange={(_e, { open: isOpen }) => onOpenChange(isOpen)}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          <LayerRegular style={{ marginRight: 8 }} />
          {component
            ? (component.layers?.[0]?.msdyn_name ?? component.objectid)
            : "Component Layers"}
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.drawerBody}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Spinner label="Loading layers..." />
          </div>
        ) : layers.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No layers found for this component.</Text>
          </div>
        ) : (
          <>
            {/* Layer list */}
            <div className={styles.layerList}>
              {layers.map((layer) => {
                const isActive =
                  layer.msdyn_solutionname?.toLowerCase() === "active";
                const isSelected =
                  currentLayer?.msdyn_componentlayerid ===
                  layer.msdyn_componentlayerid;
                return (
                  <div
                    key={layer.msdyn_componentlayerid}
                    className={`${styles.layerCard} ${isActive ? styles.layerCardActive : ""} ${isSelected ? styles.layerCardSelected : ""}`}
                    onClick={() => handleLayerSelect(layer)}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    <span className={styles.layerOrder}>
                      {layer.msdyn_order}
                    </span>
                    <span className={styles.layerName}>
                      {layer.msdyn_solutionname}
                    </span>
                    {isActive && (
                      <Badge
                        color="warning"
                        appearance="filled"
                        shape="rounded"
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detail panel for selected layer */}
            {currentLayer && (
              <div className={styles.jsonSection}>
                <TabList
                  selectedValue={selectedTab}
                  onTabSelect={(_e, d) => setSelectedTab(String(d.value))}
                >
                  {currentLayer.msdyn_componentjson && (
                    <Tab value="properties">Properties</Tab>
                  )}
                  {currentLayer.msdyn_changes && (
                    <Tab value="changes">Changes</Tab>
                  )}
                  {currentLayer.msdyn_children && (
                    <Tab value="children">Children</Tab>
                  )}
                </TabList>
                <div className={styles.tabContent}>
                  {selectedTab === "properties" &&
                    currentLayer.msdyn_componentjson && (
                      <LayerDetailsViewer
                        json={currentLayer.msdyn_componentjson}
                      />
                    )}
                  {selectedTab === "changes" && currentLayer.msdyn_changes && (
                    <LayerDetailsViewer json={currentLayer.msdyn_changes} />
                  )}
                  {selectedTab === "children" &&
                    currentLayer.msdyn_children && (
                      <LayerDetailsViewer json={currentLayer.msdyn_children} />
                    )}
                </div>
              </div>
            )}
          </>
        )}
      </DrawerBody>
    </OverlayDrawer>
  );
};
