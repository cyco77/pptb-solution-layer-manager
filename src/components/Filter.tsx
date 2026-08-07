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
  Switch,
  useId,
  tokens,
} from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";
import { Solution } from "../types/solution";
import { ManagedFilter } from "../types/solutionFilters";

export interface IFilterProps {
  solutions: Solution[];
  selectedSolutionId: string | null;
  managedFilter: ManagedFilter;
  includeHidden: boolean;
  isLoadingSolutions: boolean;
  isDeletingLayers?: boolean;
  onSolutionChanged: (solutionId: string | null) => void;
  onManagedFilterChanged: (value: ManagedFilter) => void;
  onIncludeHiddenChanged: (value: boolean) => void;
  onReloadSolutions: () => void;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  field: {
    display: "grid",
    justifyItems: "start",
    gap: "2px",
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  combobox: {
    minWidth: "320px",
  },
  managedFilterDropdown: {
    minWidth: "160px",
  },
  optionContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    width: "100%",
  },
  optionName: {
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase300,
  },
  optionMeta: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    width: "100%",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase200,
  },
  optionVersion: {
    fontSize: tokens.fontSizeBase200,
  },
  optionManagedState: {
    marginLeft: "auto",
    fontSize: tokens.fontSizeBase200,
  },
  controls: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  switches: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
});

export const Filter = (props: IFilterProps): JSXElement => {
  const solutionComboId = useId("solution-combo");
  const managedFilterId = useId("managed-filter");
  const styles = useStyles();
  const { isDeletingLayers = false } = props;

  const selectedSolution = props.solutions.find(
    (s) => s.solutionid === props.selectedSolutionId,
  );

  const onSolutionSelect = (
    _event: SelectionEvents,
    data: OptionOnSelectData,
  ) => {
    props.onSolutionChanged(data.optionValue ?? null);
  };

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
        <label htmlFor={solutionComboId} className={styles.label}>
          Solution
        </label>
        <div style={{ display: "flex", gap: "4px" }}>
          <Combobox
            id={solutionComboId}
            placeholder="Select a solution…"
            onOptionSelect={onSolutionSelect}
            className={styles.combobox}
            value={selectedSolution?.friendlyname ?? ""}
            selectedOptions={
              props.selectedSolutionId ? [props.selectedSolutionId] : []
            }
            disabled={props.isLoadingSolutions || isDeletingLayers}
          >
            {props.solutions.map((s) => (
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

      <div className={styles.controls}>
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

        <div className={styles.switches}>
          <Switch
            label="Hidden"
            checked={props.includeHidden}
            onChange={(_e, d) => props.onIncludeHiddenChanged(d.checked)}
            disabled={isDeletingLayers}
          />
        </div>
      </div>
    </div>
  );
};
