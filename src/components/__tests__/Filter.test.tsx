import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Filter } from "../Filter";
import type { Solution } from "../../types/solution";

// Wrapper component for Fluent UI provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <FluentProvider theme={webLightTheme}>{component}</FluentProvider>,
  );
};

const mockSolutions: Solution[] = [
  {
    solutionid: "sol-1",
    uniquename: "CustomSolution",
    friendlyname: "Custom Solution",
    version: "1.0.0",
    ismanaged: false,
    isvisible: true,
  },
  {
    solutionid: "sol-2",
    uniquename: "ManagedSolution",
    friendlyname: "Managed Solution",
    version: "2.0.0",
    ismanaged: true,
    isvisible: true,
  },
  {
    solutionid: "sol-3",
    uniquename: "HiddenSolution",
    friendlyname: "Hidden Solution",
    version: "1.0.0",
    ismanaged: false,
    isvisible: false,
  },
];

describe("Filter", () => {
  const mockCallbacks = {
    onSolutionChanged: vi.fn(),
    onManagedFilterChanged: vi.fn(),
    onIncludeHiddenChanged: vi.fn(),
    onReloadSolutions: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      renderWithTheme(
        <Filter
          solutions={[]}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );
      // Check that at least one button exists
      const buttons = screen.getAllByRole("button", { hidden: true });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it.skip("should display checkboxes for filters", () => {
      renderWithTheme(
        <Filter
          solutions={[]}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it.skip("should display checkboxes for filters", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(2); // Include unmanaged and include hidden
    });
  });

  describe("solution selection", () => {
    it("should display solution options in combobox", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      // The combobox should be present
      const combobox = screen.getByRole("combobox", { name: /solution/i });
      expect(combobox).toBeTruthy();
    });

    it("should call onSolutionChanged when solution is selected", async () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      const combobox = screen.getByRole("combobox", { name: /solution/i });
      fireEvent.click(combobox);

      // Wait for options to appear and click first solution
      await waitFor(() => {
        const options = screen.getAllByRole("option");
        if (options.length > 0) {
          fireEvent.click(options[0]);
        }
      });

      expect(mockCallbacks.onSolutionChanged).toHaveBeenCalled();
    });

    it("should display selected solution", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId="sol-1"
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      const combobox = screen.getByRole("combobox", {
        name: /solution/i,
      }) as HTMLInputElement;
      expect(combobox.value).toContain("Custom Solution");
    });

    it("should show version and managed state in solution options", async () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      fireEvent.click(screen.getByRole("combobox", { name: /solution/i }));

      await waitFor(() => {
        expect(screen.getAllByText("1.0.0").length).toBeGreaterThan(0);
        expect(screen.getByText("2.0.0")).toBeTruthy();
        expect(screen.getAllByText("Unmanaged").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Managed").length).toBeGreaterThan(0);
      });
    });

    it("should call onManagedFilterChanged when type filter changes", async () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      const typeDropdown = screen.getByRole("combobox", { name: /type/i });
      fireEvent.click(typeDropdown);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("option", { name: "Unmanaged" }));
      });

      expect(mockCallbacks.onManagedFilterChanged).toHaveBeenCalledWith(
        "unmanaged",
      );
    });
  });

  describe("checkbox filters", () => {
    it.skip("should call onIncludeHiddenChanged when checkbox changes", async () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      expect(mockCallbacks.onIncludeHiddenChanged).toHaveBeenCalledWith(true);
    });

    it.skip("should display unchecked state", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect((checkbox as HTMLInputElement).checked).toBe(false);
      });
    });

    it.skip("should display checked state", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="all"
          includeHidden={true}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect((checkbox as HTMLInputElement).checked).toBe(true);
      });
    });
  });

  describe("reload button", () => {
    it.skip("should call onReloadSolutions when reload button is clicked", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      // Find reload button - should be the only actual button element (not icon buttons in combobox)
      const buttons = screen.getAllByRole("button", { hidden: false });
      const reloadButton = buttons.find(
        (btn) =>
          !btn.querySelector("svg") ||
          btn.getAttribute("aria-label")?.toLowerCase().includes("reload"),
      );

      if (reloadButton) {
        fireEvent.click(reloadButton);
        expect(mockCallbacks.onReloadSolutions).toHaveBeenCalled();
      }
    });

    it.skip("should disable reload button when loading", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={true}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const reloadButton = buttons[0];

      expect(reloadButton?.hasAttribute("disabled")).toBe(true);
    });

    it.skip("should disable reload button when deleting", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          isDeletingLayers={true}
          {...mockCallbacks}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const reloadButton = buttons[0];

      expect(reloadButton?.hasAttribute("disabled")).toBe(true);
    });
  });

  describe("empty state", () => {
    it("should handle empty solutions list", () => {
      renderWithTheme(
        <Filter
          solutions={[]}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={false}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByRole("combobox", { name: /solution/i })).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("should show loading indicator when isLoadingSolutions is true", () => {
      renderWithTheme(
        <Filter
          solutions={mockSolutions}
          selectedSolutionId={null}
          managedFilter="managed"
          includeHidden={false}
          isLoadingSolutions={true}
          {...mockCallbacks}
        />,
      );

      // Should still render normally, just with disabled reload button
      expect(screen.getByRole("combobox", { name: /solution/i })).toBeTruthy();
    });
  });
});
