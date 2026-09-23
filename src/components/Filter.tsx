import { useState } from "react";
import type {
  JSXElement,
  OptionOnSelectData,
  SelectionEvents,
} from "@fluentui/react-components";
import {
  Badge,
  Button,
  Combobox,
  Dropdown,
  makeStyles,
  Option,
  useId,
  tokens,
} from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";
import { Solution } from "../types/solution";
import { ManagedFilter } from "../types/solutionFilters";

export interface IFilterProps {
  solutions: Solution[];
  selectedPublisherNames?: string[];
  selectedSolutionIds?: string[];
  /** @deprecated Kept for compatibility with integrations using the earlier single-solution filter. */
  selectedSolutionId?: string | null;
  /** @deprecated The hidden-solution toggle was removed; solutions are now always visible-only. */
  includeHidden?: boolean;
  managedFilter: ManagedFilter;
  isLoadingSolutions: boolean;
  isDeletingLayers?: boolean;
  onPublisherChanged?: (publisherNames: string[]) => void;
  onSolutionsChanged?: (solutionIds: string[]) => void;
  /** @deprecated Kept for compatibility with integrations using the earlier single-solution filter. */
  onSolutionChanged?: (solutionId: string | null) => void;
  onManagedFilterChanged: (value: ManagedFilter) => void;
  onReloadSolutions: () => void;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap",
    minWidth: 0,
  },
  field: {
    display: "grid",
    justifyItems: "start",
    gap: "2px",
    minWidth: 0,
    flex: "0 0 auto",
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  filterDropdown: {
    width: "240px",
    minWidth: "240px",
    maxWidth: "240px",
    flex: "0 0 240px",
    boxSizing: "border-box",
    "& button": {
      maxWidth: "100%",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
  },
  solutionDropdown: {
    width: "420px",
    minWidth: "420px",
    maxWidth: "420px",
    flex: "0 0 420px",
    boxSizing: "border-box",
    "& button": {
      maxWidth: "100%",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
  },
  managedFilterDropdown: {
    width: "160px",
    minWidth: "160px",
    maxWidth: "160px",
    flex: "0 0 160px",
  },
  optionContent: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: tokens.spacingVerticalXXS,
    width: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  optionName: {
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase300,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  optionMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
    width: "100%",
    minWidth: 0,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase200,
  },
  optionVersion: {
    fontSize: tokens.fontSizeBase200,
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  optionManagedState: {
    marginLeft: "auto",
    flexShrink: 0,
    fontSize: tokens.fontSizeBase200,
  },
  solutionListbox: {
    width: "420px",
    minWidth: "420px",
    maxWidth: "420px",
    overflowX: "hidden",
    boxSizing: "border-box",
  },
});

export const Filter = (props: IFilterProps): JSXElement => {
  const solutionComboId = useId("solution-combo");
  const publisherComboId = useId("publisher-combo");
  const managedFilterId = useId("managed-filter");
  const styles = useStyles();
  const { isDeletingLayers = false } = props;
  const [solutionQuery, setSolutionQuery] = useState("");
  const selectedPublisherNames = props.selectedPublisherNames ?? [];
  const selectedSolutionIds =
    props.selectedSolutionIds ??
    (props.selectedSolutionId ? [props.selectedSolutionId] : []);
  const selectedSolutionNames = selectedSolutionIds
    .map(
      (id) =>
        props.solutions.find((solution) => solution.solutionid === id)
          ?.friendlyname,
    )
    .filter((name): name is string => Boolean(name));

  const onSolutionSelect = (
    _event: SelectionEvents,
    data: OptionOnSelectData,
  ) => {
    props.onSolutionsChanged?.(data.selectedOptions);
    props.onSolutionChanged?.(data.selectedOptions[0] ?? null);
    setSolutionQuery("");
  };

  const publisherNames = [
    ...new Set(
      props.solutions
        .map((solution) => solution.publisherName)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const availableSolutions = props.solutions.filter(
    (solution) =>
      selectedPublisherNames.length === 0 ||
      (solution.publisherName &&
        selectedPublisherNames.includes(solution.publisherName)),
  );

  const onManagedFilterSelect = (
    _event: SelectionEvents,
    data: OptionOnSelectData,
  ) => {
    const value = data.optionValue as ManagedFilter | undefined;

    if (value) {
      props.onManagedFilterChanged(value);
    }
  };

  const managedFilterLabel =
    props.managedFilter === "managed"
      ? "Managed"
      : props.managedFilter === "unmanaged"
        ? "Unmanaged"
        : "All";

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <label htmlFor={publisherComboId} className={styles.label}>
          Publisher
        </label>
        <Dropdown
          id={publisherComboId}
          multiselect
          placeholder="Filter publishers…"
          className={styles.filterDropdown}
          selectedOptions={selectedPublisherNames}
          value={selectedPublisherNames.join(", ")}
          disabled={props.isLoadingSolutions || isDeletingLayers}
          onOptionSelect={(_event, data) =>
            props.onPublisherChanged?.(data.selectedOptions)
          }
        >
          {publisherNames.map((name) => (
            <Option key={name} value={name}>
              {name}
            </Option>
          ))}
        </Dropdown>
      </div>
      <div className={styles.field}>
        <label htmlFor={managedFilterId} className={styles.label}>
          Type
        </label>
        <Dropdown
          id={managedFilterId}
          value={managedFilterLabel}
          selectedOptions={[props.managedFilter]}
          className={styles.managedFilterDropdown}
          disabled={props.isLoadingSolutions || isDeletingLayers}
          onOptionSelect={onManagedFilterSelect}
        >
          <Option value="managed" text="Managed">
            Managed
          </Option>
          <Option value="unmanaged" text="Unmanaged">
            Unmanaged
          </Option>
          <Option value="all" text="All">
            All
          </Option>
        </Dropdown>
      </div>
      <div className={styles.field}>
        <label htmlFor={solutionComboId} className={styles.label}>
          Solution
        </label>
        <div style={{ display: "flex", gap: "4px" }}>
          <Combobox
            id={solutionComboId}
            multiselect
            placeholder="Filter solutions…"
            onOptionSelect={onSolutionSelect}
            onChange={(event) => setSolutionQuery(event.target.value)}
            className={styles.solutionDropdown}
            listbox={{ className: styles.solutionListbox }}
            value={solutionQuery || selectedSolutionNames.join(", ")}
            selectedOptions={selectedSolutionIds}
            disabled={props.isLoadingSolutions || isDeletingLayers}
          >
            {availableSolutions.map((s) => (
              <Option
                key={s.solutionid}
                value={s.solutionid}
                text={`${s.friendlyname} ${s.version} ${s.ismanaged ? "Managed" : "Unmanaged"}`}
              >
                <div className={styles.optionContent}>
                  <span className={styles.optionName}>{s.friendlyname}</span>
                  <div className={styles.optionMeta}>
                    <span className={styles.optionVersion}>{s.version}</span>
                    <Badge
                      appearance="filled"
                      color={s.ismanaged ? "success" : "informative"}
                      className={styles.optionManagedState}
                    >
                      {s.ismanaged ? "Managed" : "Unmanaged"}
                    </Badge>
                  </div>
                </div>
              </Option>
            ))}
          </Combobox>
          <Button
            icon={<ArrowSyncRegular />}
            appearance="subtle"
            title="Reload solutions"
            onClick={props.onReloadSolutions}
            disabled={props.isLoadingSolutions || isDeletingLayers}
          />
        </div>
      </div>
    </div>
  );
};
