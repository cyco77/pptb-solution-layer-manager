import type {
  JSXElement,
  OptionOnSelectData,
  SelectionEvents,
} from "@fluentui/react-components";
import {
  Button,
  Combobox,
  makeStyles,
  Option,
  Switch,
  useId,
  tokens,
} from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";
import { Solution } from "../types/solution";

export interface IFilterProps {
  solutions: Solution[];
  selectedSolutionId: string | null;
  includeUnmanaged: boolean;
  includeHidden: boolean;
  isLoadingSolutions: boolean;
  isDeletingLayers?: boolean;
  onSolutionChanged: (solutionId: string | null) => void;
  onIncludeUnmanagedChanged: (value: boolean) => void;
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
  switches: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
});

export const Filter = (props: IFilterProps): JSXElement => {
  const solutionComboId = useId("solution-combo");
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
                text={s.friendlyname}
              >
                {s.friendlyname}{" "}
                <span
                  style={{
                    color: tokens.colorNeutralForeground3,
                    fontSize: "11px",
                  }}
                >
                  {s.version}
                </span>
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

      <div className={styles.switches}>
        <Switch
          label="Unmanaged"
          checked={props.includeUnmanaged}
          onChange={(_e, d) => props.onIncludeUnmanagedChanged(d.checked)}
          disabled={isDeletingLayers}
        />
        <Switch
          label="Hidden"
          checked={props.includeHidden}
          onChange={(_e, d) => props.onIncludeHiddenChanged(d.checked)}
          disabled={isDeletingLayers}
        />
      </div>
    </div>
  );
};
