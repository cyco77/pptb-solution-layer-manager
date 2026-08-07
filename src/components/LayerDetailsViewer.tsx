import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Button,
  Input,
  makeStyles,
  tokens,
  Text,
  Badge,
  Tooltip,
} from "@fluentui/react-components";
import {
  SearchRegular,
  CopyRegular,
  ChevronUpRegular,
  ChevronDownRegular,
  CodeRegular,
  DataTreemapRegular,
} from "@fluentui/react-icons";
import {
  parseLayerDetails,
  formatLayerValue,
  getTypeBadgeColor,
  countMatches,
  filterLayerDetails,
  getValueType,
  type ValueType,
} from "../utils/layerUtils";

interface LayerDetailsViewerProps {
  json: string | undefined;
}

type ViewMode = "structured" | "json";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    height: "100%",
    minHeight: 0,
  },
  toolbar: {
    display: "flex",
    gap: tokens.spacingHorizontalL,
    alignItems: "center",
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexWrap: "nowrap",
    overflowX: "auto",
  },
  toolbarGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  toolbarButtonGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalM,
    flexShrink: 0,
  },
  searchInput: {
    minWidth: "220px",
  },
  viewContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  jsonView: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    height: "100%",
    overflowY: "auto",
    margin: 0,
  },
  structuredView: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
  },
  keyValueItem: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    alignItems: "start",
  },
  keyLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    wordBreak: "break-word",
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  valueContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    width: "100%",
  },
  valueBadge: {
    flexShrink: 0,
  },
  value: {
    flex: 1,
    wordBreak: "break-word",
    color: tokens.colorNeutralForeground1,
  },
  stringValue: {
    color: "#107c10",
    fontFamily: tokens.fontFamilyMonospace,
  },
  numberValue: {
    color: "#1081d7",
    fontFamily: tokens.fontFamilyMonospace,
  },
  booleanValue: {
    color: "#1081d7",
    fontFamily: tokens.fontFamilyMonospace,
    fontWeight: tokens.fontWeightSemibold,
  },
  nullValue: {
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
    fontStyle: "italic",
  },
  objectValue: {
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyMonospace,
  },
  copyButton: {
    flexShrink: 0,
  },
  noResults: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground3,
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  tooltipContent: {
    maxWidth: "500px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
  viewToggleButton: {
    flexShrink: 0,
  },
  jsonViewContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    height: "100%",
    minHeight: 0,
  },
  jsonSearchBar: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  jsonContent: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
    lineHeight: "1.6",
  },
  highlight: {
    backgroundColor: tokens.colorStatusWarningBackground2,
    color: tokens.colorNeutralForeground1,
    fontWeight: "bold",
  },
  highlightCurrent: {
    backgroundColor: tokens.colorStatusSuccessBackground2,
    color: tokens.colorNeutralForeground1,
    fontWeight: "bold",
  },
  expandedContent: {
    gridColumn: "1 / -1",
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: tokens.spacingVerticalS,
  },
  expandedItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase200,
  },
  expandedKey: {
    fontWeight: tokens.fontWeightSemibold,
    minWidth: "120px",
    color: tokens.colorNeutralForeground2,
    wordBreak: "break-word",
  },
  expandedValue: {
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyMonospace,
    wordBreak: "break-word",
    flex: 1,
  },
});

const getTooltipContent = (value: any, type: ValueType): string => {
  if (type === "null") return "null";
  if (type === "string") return String(value);
  if (type === "number") return String(value);
  if (type === "boolean") return String(value);
  if (type === "array" || type === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

interface HighlightSegment {
  text: string;
  isMatch: boolean;
  isCurrent: boolean;
}

const createHighlightSegments = (
  text: string,
  searchTerm: string,
  currentIndex: number,
): HighlightSegment[] => {
  if (!searchTerm) {
    return [{ text, isMatch: false, isCurrent: false }];
  }

  const segments: HighlightSegment[] = [];
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  let currentMatchCount = 0;
  let lastIndex = 0;

  let index = 0;
  while ((index = lowerText.indexOf(lowerSearch, lastIndex)) !== -1) {
    // Add text before match
    if (index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, index),
        isMatch: false,
        isCurrent: false,
      });
    }

    // Add match
    const isCurrent = currentMatchCount === currentIndex;
    segments.push({
      text: text.substring(index, index + searchTerm.length),
      isMatch: true,
      isCurrent,
    });

    lastIndex = index + searchTerm.length;
    currentMatchCount++;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isMatch: false,
      isCurrent: false,
    });
  }

  return segments.length > 0
    ? segments
    : [{ text, isMatch: false, isCurrent: false }];
};

export const LayerDetailsViewer: React.FC<LayerDetailsViewerProps> = ({
  json,
}) => {
  const styles = useStyles();
  const jsonContentRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("structured");
  const [filterText, setFilterText] = useState("");
  const [jsonSearchText, setJsonSearchText] = useState("");
  const [jsonCurrentMatchIndex, setJsonCurrentMatchIndex] = useState(0);

  const kvPairs = useMemo(() => parseLayerDetails(json), [json]);

  const filteredPairs = useMemo(
    () => filterLayerDetails(kvPairs, filterText),
    [kvPairs, filterText],
  );

  const jsonText = useMemo(() => {
    if (!json) return "";
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return "";
    }
  }, [json]);

  const jsonMatchCount = useMemo(
    () => countMatches(jsonText, jsonSearchText),
    [jsonText, jsonSearchText],
  );

  const handleJsonNextMatch = () => {
    if (jsonMatchCount > 0) {
      setJsonCurrentMatchIndex((prev) => (prev + 1) % jsonMatchCount);
    }
  };

  const handleJsonPrevMatch = () => {
    if (jsonMatchCount > 0) {
      setJsonCurrentMatchIndex((prev) =>
        prev === 0 ? jsonMatchCount - 1 : prev - 1,
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyValue = (value: any) => {
    if (typeof value === "string") {
      copyToClipboard(value);
    } else {
      copyToClipboard(JSON.stringify(value, null, 2));
    }
  };

  const hasExpandedContent = (value: any, type: "array" | "object") => {
    if (type === "array") {
      return Array.isArray(value) && value.length > 0;
    }

    return Object.keys(value).length > 0;
  };

  const renderExpandedContent = (value: any, type: "array" | "object") => {
    if (type === "array") {
      return (
        <div className={styles.expandedContent}>
          {(value as any[]).map((item, idx) => {
            const itemType = getValueType(item);
            const displayValue = formatLayerValue(item, itemType);
            return (
              <div key={idx} className={styles.expandedItem}>
                <div className={styles.expandedKey}>[{idx}]</div>
                <div className={styles.expandedValue}>
                  {itemType === "object" || itemType === "array"
                    ? JSON.stringify(item, null, 2)
                    : displayValue}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // object
      return (
        <div className={styles.expandedContent}>
          {Object.entries(value).map(([objKey, objValue]) => {
            const itemType = getValueType(objValue);
            const displayValue = formatLayerValue(objValue, itemType);
            return (
              <div key={objKey} className={styles.expandedItem}>
                <div className={styles.expandedKey}>{objKey}</div>
                <div className={styles.expandedValue}>
                  {itemType === "object" || itemType === "array"
                    ? JSON.stringify(objValue, null, 2)
                    : displayValue}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };

  // Scroll to current match in JSON view
  useEffect(() => {
    if (viewMode === "json" && jsonSearchText && jsonSearchText.trim()) {
      // Use a small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        if (jsonContentRef.current) {
          const element = jsonContentRef.current.querySelector(
            `[data-match-index="${jsonCurrentMatchIndex}"]`,
          ) as HTMLElement;

          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [jsonCurrentMatchIndex, viewMode, jsonSearchText]);

  if (!json) {
    return (
      <div className={styles.noResults}>
        <Text>No data to display</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          {viewMode === "structured" ? (
            <>
              <Input
                contentBefore={<SearchRegular />}
                placeholder="Filter by key or value..."
                value={filterText}
                onChange={(_, data) => setFilterText(data.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className={styles.searchInput}
              />
              {filterText && (
                <Text className={styles.label}>
                  {filteredPairs.length} / {kvPairs.length}
                </Text>
              )}
            </>
          ) : (
            <>
              <Input
                contentBefore={<SearchRegular />}
                placeholder="Search in JSON..."
                value={jsonSearchText}
                onChange={(_, data) => {
                  setJsonSearchText(data.value);
                  setJsonCurrentMatchIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (jsonMatchCount > 0) {
                      if (e.shiftKey) {
                        handleJsonPrevMatch();
                      } else {
                        handleJsonNextMatch();
                      }
                    }
                  }
                }}
                className={styles.searchInput}
              />
              {jsonSearchText && jsonMatchCount > 0 && (
                <div className={styles.toolbarGroup}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronUpRegular />}
                    onClick={handleJsonPrevMatch}
                    title="Previous match"
                  />
                  <Text className={styles.label}>
                    {jsonCurrentMatchIndex + 1} / {jsonMatchCount}
                  </Text>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronDownRegular />}
                    onClick={handleJsonNextMatch}
                    title="Next match"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.toolbarButtonGroup}>
          <Tooltip content="Copy to clipboard" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<CopyRegular />}
              onClick={() => {
                navigator.clipboard.writeText(jsonText);
              }}
              title="Copy to clipboard"
            />
          </Tooltip>

          <Tooltip
            content={
              viewMode === "structured"
                ? "Switch to JSON"
                : "Switch to Structured"
            }
            relationship="label"
          >
            <Button
              appearance="outline"
              icon={
                viewMode === "structured" ? (
                  <CodeRegular />
                ) : (
                  <DataTreemapRegular />
                )
              }
              onClick={() =>
                setViewMode(viewMode === "structured" ? "json" : "structured")
              }
            />
          </Tooltip>
        </div>
      </div>

      {/* View Container */}
      <div className={styles.viewContainer}>
        {viewMode === "json" ? (
          <div className={styles.jsonViewContainer}>
            <div className={styles.jsonContent} ref={jsonContentRef}>
              {jsonSearchText ? (
                <div>
                  {(() => {
                    let matchIndex = 0;
                    return createHighlightSegments(
                      jsonText,
                      jsonSearchText,
                      jsonCurrentMatchIndex,
                    ).map((segment, idx) => {
                      if (segment.isMatch) {
                        const currentMatchIndex = matchIndex;
                        matchIndex++;
                        return (
                          <span
                            key={idx}
                            data-match-index={currentMatchIndex}
                            className={
                              segment.isCurrent
                                ? styles.highlightCurrent
                                : styles.highlight
                            }
                          >
                            {segment.text}
                          </span>
                        );
                      }
                      return <span key={idx}>{segment.text}</span>;
                    });
                  })()}
                </div>
              ) : (
                jsonText
              )}
            </div>
          </div>
        ) : (
          <>
            {filteredPairs.length === 0 ? (
              <div className={styles.noResults}>
                <Text>No matching properties found</Text>
              </div>
            ) : (
              <div className={styles.structuredView}>
                {filteredPairs.map((pair, index) => (
                  <div
                    key={`${pair.originalKey}-${index}`}
                    className={styles.keyValueItem}
                  >
                    <div className={styles.keyLabel}>
                      <span>{pair.originalKey}</span>
                      <Badge
                        color={getTypeBadgeColor(pair.type)}
                        appearance="tint"
                        size="small"
                        className={styles.valueBadge}
                      >
                        {pair.type}
                      </Badge>
                    </div>
                    <div className={styles.valueContent}>
                      <div
                        className={`${styles.value} ${
                          pair.type === "string"
                            ? styles.stringValue
                            : pair.type === "number"
                              ? styles.numberValue
                              : pair.type === "boolean"
                                ? styles.booleanValue
                                : pair.type === "null"
                                  ? styles.nullValue
                                  : styles.objectValue
                        }`}
                      >
                        <Tooltip
                          content={
                            <div className={styles.tooltipContent}>
                              {getTooltipContent(pair.value, pair.type)}
                            </div>
                          }
                          relationship="label"
                          positioning="above"
                        >
                          <span>{formatLayerValue(pair.value, pair.type)}</span>
                        </Tooltip>
                      </div>
                      {pair.type !== "null" && (
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<CopyRegular />}
                          className={styles.copyButton}
                          onClick={() => handleCopyValue(pair.value)}
                          title="Copy value"
                        />
                      )}
                    </div>
                    {(pair.type === "array" || pair.type === "object") &&
                      hasExpandedContent(pair.value, pair.type) &&
                      renderExpandedContent(pair.value, pair.type)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
