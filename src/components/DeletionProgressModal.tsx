import React from "react";
import { makeStyles, Spinner, Text, tokens } from "@fluentui/react-components";

interface IDeletionProgressModalProps {
  current: number;
  total: number;
}

const useStyles = makeStyles({
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    boxShadow: tokens.shadow28,
  },
  spinner: {
    marginBottom: "8px",
  },
  progressText: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: "center",
  },
  countText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    textAlign: "center",
  },
});

export const DeletionProgressModal: React.FC<IDeletionProgressModalProps> = ({
  current,
  total,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.spinner}>
          <Spinner size="large" />
        </div>
        <Text className={styles.progressText}>Removing Active Layers</Text>
        <Text className={styles.countText}>
          {current} of {total}
        </Text>
      </div>
    </div>
  );
};
