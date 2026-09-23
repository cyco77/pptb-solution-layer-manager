import React, { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  makeStyles,
  SearchBox,
  SearchBoxChangeEvent,
  Text,
  Tree,
  TreeItem,
  TreeItemLayout,
  tokens,
} from "@fluentui/react-components";
import { DeleteRegular, DocumentSearchRegular } from "@fluentui/react-icons";
import { ComponentWithLayers } from "../types/solutionComponent";

interface IActiveLayersTreeProps {
  groups: Array<{ typeName: string; components: ComponentWithLayers[] }>;
  isDeletingLayers?: boolean;
  onOpenDetails: (solutionComponentId: string) => void;
  onDeleteSelected: (components: ComponentWithLayers[]) => void;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  groupName: {
    flex: 1,
    fontWeight: tokens.fontWeightSemibold,
  },
  groupCount: {
    marginLeft: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  search: {
    flex: 1,
    minWidth: "160px",
  },
  treeBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
  },
  childLayout: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    width: "100%",
    minWidth: 0,
  },
  componentName: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minHeight: "40px",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  footerCount: {
    flex: 1,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  empty: {
    padding: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
  },
});

export const ActiveLayersTree: React.FC<IActiveLayersTreeProps> = ({
  groups,
  isDeletingLayers = false,
  onOpenDetails,
  onDeleteSelected,
}) => {
  const styles = useStyles();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        components: query
          ? group.components.filter((component) => {
              const name = getComponentName(component).toLowerCase();
              return (
                name.includes(query) ||
                component.objectid.toLowerCase().includes(query)
              );
            })
          : group.components,
      }))
      .filter((group) => group.components.length > 0);
  }, [groups, search]);
  const filteredComponents = filteredGroups.flatMap(
    (group) => group.components,
  );

  const selectedComponents = filteredComponents.filter((component) =>
    selectedIds.has(component.solutioncomponentid),
  );
  const allVisibleSelected =
    filteredComponents.length > 0 &&
    filteredComponents.every((component) =>
      selectedIds.has(component.solutioncomponentid),
    );

  const toggleComponent = (id: string, checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <section className={styles.root} aria-label="Active layers tree">
      <div className={styles.searchBar}>
        <Checkbox
          aria-label="Select all active layer components"
          checked={allVisibleSelected}
          onChange={(_, data) => {
            setSelectedIds((previous) => {
              const next = new Set(previous);
              for (const component of filteredComponents) {
                if (data.checked === true)
                  next.add(component.solutioncomponentid);
                else next.delete(component.solutioncomponentid);
              }
              return next;
            });
          }}
        />
        <SearchBox
          className={styles.search}
          placeholder="Search components…"
          value={search}
          onChange={(_event: SearchBoxChangeEvent, data: { value: string }) =>
            setSearch(data.value)
          }
          size="small"
        />
      </div>

      <div className={styles.treeBody}>
        {filteredComponents.length === 0 ? (
          <Text className={styles.empty}>No components match this search.</Text>
        ) : (
          <Tree
            aria-label="Active layers grouped by component type"
            defaultOpenItems={filteredGroups.map((group) => group.typeName)}
          >
            {filteredGroups.map((group) => (
              <TreeItem
                itemType="branch"
                value={group.typeName}
                key={group.typeName}
              >
                <TreeItemLayout>
                  <Text className={styles.groupName}>{group.typeName}</Text>
                  <Badge
                    className={styles.groupCount}
                    appearance="tint"
                    color="informative"
                    shape="rounded"
                  >
                    {group.components.length}
                  </Badge>
                </TreeItemLayout>
                <Tree aria-label={`${group.typeName} components`}>
                  {group.components.map((component) => (
                    <TreeItem
                      itemType="leaf"
                      value={component.solutioncomponentid}
                      key={component.solutioncomponentid}
                    >
                      <TreeItemLayout>
                        <div className={styles.childLayout}>
                          <Checkbox
                            aria-label={`Select ${getComponentName(component)}`}
                            checked={selectedIds.has(
                              component.solutioncomponentid,
                            )}
                            disabled={isDeletingLayers}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(_, data) =>
                              toggleComponent(
                                component.solutioncomponentid,
                                data.checked === true,
                              )
                            }
                          />
                          <Text
                            className={styles.componentName}
                            title={getComponentName(component)}
                          >
                            {getComponentName(component)}
                          </Text>
                          <Badge
                            appearance="filled"
                            color="warning"
                            shape="rounded"
                          >
                            Active
                          </Badge>
                          <Button
                            appearance="subtle"
                            icon={<DocumentSearchRegular />}
                            size="small"
                            title={`Show active layer details for ${getComponentName(component)}`}
                            aria-label={`Show details for ${getComponentName(component)}`}
                            disabled={isDeletingLayers}
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenDetails(component.solutioncomponentid);
                            }}
                          />
                        </div>
                      </TreeItemLayout>
                    </TreeItem>
                  ))}
                </Tree>
              </TreeItem>
            ))}
          </Tree>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerCount}>
          {selectedComponents.length > 0
            ? `${selectedComponents.length} selected / ${filteredComponents.length}`
            : `${filteredComponents.length} component(s)`}
        </span>
        {selectedComponents.length > 0 && (
          <Button
            appearance="subtle"
            icon={<DeleteRegular />}
            size="small"
            disabled={isDeletingLayers}
            onClick={() => {
              onDeleteSelected(selectedComponents);
              setSelectedIds(new Set());
            }}
          >
            Delete ({selectedComponents.length})
          </Button>
        )}
      </div>
    </section>
  );
};

function getComponentName(component: ComponentWithLayers): string {
  return (
    component.name ?? component.layers?.[0]?.msdyn_name ?? component.objectid
  );
}
