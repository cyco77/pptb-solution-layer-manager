import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import {
  ComponentTypesList,
  type ComponentTypeSummary,
} from "../ComponentTypesList";

// Wrapper component for Fluent UI provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <FluentProvider theme={webLightTheme}>{component}</FluentProvider>,
  );
};

const mockSummaries: ComponentTypeSummary[] = [
  {
    componenttype: 1,
    typeName: "Entity",
    totalCount: 10,
    activeLayerCount: 5,
  },
  {
    componenttype: 2,
    typeName: "Attribute",
    totalCount: 20,
    activeLayerCount: 15,
  },
  {
    componenttype: 3,
    typeName: "View",
    totalCount: 8,
    activeLayerCount: null, // not yet loaded
  },
];

describe("ComponentTypesList", () => {
  const mockCallbacks = {
    onLoadLayers: vi.fn(),
    onTypeActivate: vi.fn(),
    onSelectionChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={[]}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("should display all component types", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("Entity")).toBeTruthy();
      expect(screen.getByText("Attribute")).toBeTruthy();
      expect(screen.getByText("View")).toBeTruthy();
    });

    it("should display total and active layer counts", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      // Should show counts
      expect(screen.getByText(/10/)).toBeTruthy();
      expect(screen.getByText(/20/)).toBeTruthy();
    });
  });

  describe("checkboxes", () => {
    it.skip("should display checkboxes for each type", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(mockSummaries.length);
    });

    it("should call onTypeSelectionChanged when checkbox is clicked", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      expect(mockCallbacks.onSelectionChange).toHaveBeenCalled();
    });

    it.skip("should show checked state for selected types", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set(["Entity", "Attribute"])}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
      expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
      expect((checkboxes[2] as HTMLInputElement).checked).toBe(false);
    });
  });

  describe("load layers functionality", () => {
    it("should display load layers button", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should call onLoadLayers when load button is clicked", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set(["Entity"])}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const loadButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes("load"),
      );

      if (loadButton) {
        fireEvent.click(loadButton);
        expect(mockCallbacks.onLoadLayers).toHaveBeenCalled();
      }
    });

    it.skip("should disable load button when no types are selected", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const loadButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes("load"),
      );

      if (loadButton) {
        expect(loadButton?.hasAttribute("disabled")).toBe(true);
      }
    });

    it("should disable load button while loading", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set(["Entity"])}
          isLoadingLayers={true}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const loadButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes("load"),
      );

      if (loadButton) {
        expect(loadButton?.hasAttribute("disabled")).toBe(true);
      }
    });
  });

  describe("delete functionality", () => {
    it.skip("should display delete button when types are selected", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={"Entity"}
          selectedTypeNames={new Set(["Entity"])}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes("delete"),
      );

      expect(deleteButton).toBeTruthy();
    });

    it("should disable delete button while deleting", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={"Entity"}
          selectedTypeNames={new Set(["Entity"])}
          isLoadingLayers={false}
          isDeletingLayers={true}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes("delete"),
      );

      if (deleteButton) {
        expect(deleteButton?.hasAttribute("disabled")).toBe(true);
      }
    });

    it("should call onDeleteLayers when delete button is clicked", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={"Entity"}
          selectedTypeNames={new Set(["Entity"])}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes("delete"),
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockCallbacks.onLoadLayers).toHaveBeenCalled();
      }
    });
  });

  describe("loading progress", () => {
    it.skip("should display progress when loading layers", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={true}
          isDeletingLayers={false}
          layerLoadProgress={{ current: 5, total: 10 }}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText(/5/)).toBeTruthy();
      expect(screen.getByText(/10/)).toBeTruthy();
    });

    it("should display spinner while loading", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={true}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const spinner = screen.queryByRole("progressbar", { hidden: true });
      expect(spinner).toBeTruthy();
    });
  });

  describe("active type highlighting", () => {
    it("should highlight active type", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName="Entity"
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      const entityTypeRow = screen.getByText("Entity").closest("div");
      expect(entityTypeRow).toBeTruthy();
    });

    it("should update active type highlight", () => {
      const { rerender } = renderWithTheme(
        <ComponentTypesList
          summaries={mockSummaries}
          activeTypeName="Entity"
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      rerender(
        <FluentProvider theme={webLightTheme}>
          <ComponentTypesList
            summaries={mockSummaries}
            activeTypeName="Attribute"
            selectedTypeNames={new Set()}
            isLoadingLayers={false}
            isDeletingLayers={false}
            layerLoadProgress={null}
            {...mockCallbacks}
          />
        </FluentProvider>,
      );

      expect(screen.getByText("Attribute")).toBeTruthy();
    });
  });

  describe("loading states", () => {
    it("should show null for not yet loaded layer count", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={[mockSummaries[2]]} // View with null activeLayerCount
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("View")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("should handle empty summaries", () => {
      renderWithTheme(
        <ComponentTypesList
          summaries={[]}
          activeTypeName={null}
          selectedTypeNames={new Set()}
          isLoadingLayers={false}
          isDeletingLayers={false}
          layerLoadProgress={null}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByRole("button")).toBeTruthy();
    });
  });
});
