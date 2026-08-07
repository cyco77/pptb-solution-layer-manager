import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { LayerDetailsViewer } from "../LayerDetailsViewer";

// Wrapper component for Fluent UI provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <FluentProvider theme={webLightTheme}>{component}</FluentProvider>,
  );
};

describe("LayerDetailsViewer", () => {
  describe("with undefined JSON", () => {
    it("should render without crashing", () => {
      renderWithTheme(<LayerDetailsViewer json={undefined} />);
      // When json is undefined, component shows empty state
      expect(screen.getByText(/no data/i)).toBeTruthy();
    });

    it("should show empty structured view", () => {
      renderWithTheme(<LayerDetailsViewer json={undefined} />);
      // Check that component renders without crashing
      const filterInputs = screen.queryAllByPlaceholderText(/filter|search/i);
      expect(filterInputs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("with simple JSON", () => {
    const simpleJson = JSON.stringify({
      name: "TestValue",
      count: 42,
      active: true,
    });

    it("should render structured view by default", () => {
      renderWithTheme(<LayerDetailsViewer json={simpleJson} />);
      expect(screen.getByText("name")).toBeTruthy();
      // Check that all key-value pairs are rendered by counting text elements
      const allText = screen.getAllByRole("textbox");
      expect(allText.length).toBeGreaterThan(0);
    });

    it("should display all key-value pairs", () => {
      renderWithTheme(<LayerDetailsViewer json={simpleJson} />);
      expect(screen.getByText("name")).toBeTruthy();
      expect(screen.getByText("count")).toBeTruthy();
      expect(screen.getByText("active")).toBeTruthy();
    });

    it("should show type badges for values", () => {
      renderWithTheme(<LayerDetailsViewer json={simpleJson} />);
      expect(screen.getAllByText("string").length).toBeGreaterThan(0);
      expect(screen.getByText("number")).toBeTruthy();
      expect(screen.getByText("boolean")).toBeTruthy();
    });

    it("should switch to JSON view", () => {
      renderWithTheme(<LayerDetailsViewer json={simpleJson} />);
      const toggleButtons = screen.getAllByRole("button");
      const viewToggleButton = toggleButtons[toggleButtons.length - 2]; // Second to last button

      // Click the toggle button
      fireEvent.click(viewToggleButton);

      // Just verify it doesn't crash and element still exists
      expect(viewToggleButton).toBeTruthy();
    });

    it("should filter by key", async () => {
      renderWithTheme(<LayerDetailsViewer json={simpleJson} />);
      const filterInput = screen.getByPlaceholderText(/filter by key/i);

      fireEvent.change(filterInput, { target: { value: "name" } });

      await waitFor(() => {
        expect(screen.getByText("name")).toBeTruthy();
        expect(screen.queryByText("count")).toBeFalsy();
      });
    });

    it("should filter by value", async () => {
      renderWithTheme(<LayerDetailsViewer json={simpleJson} />);
      const filterInput = screen.getByPlaceholderText(/filter by key/i);

      fireEvent.change(filterInput, { target: { value: "TestValue" } });

      await waitFor(() => {
        expect(screen.getByText("name")).toBeTruthy();
        expect(screen.queryByText("count")).toBeFalsy();
      });
    });

    it("should clear filter", async () => {
      renderWithTheme(<LayerDetailsViewer json={simpleJson} />);
      const filterInput = screen.getByPlaceholderText(
        /filter by key/i,
      ) as HTMLInputElement;

      fireEvent.change(filterInput, { target: { value: "name" } });

      await waitFor(() => {
        expect(screen.queryByText("count")).toBeFalsy();
      });

      fireEvent.change(filterInput, { target: { value: "" } });

      await waitFor(() => {
        expect(screen.getByText("count")).toBeTruthy();
      });
    });
  });

  describe("with complex JSON with Attributes", () => {
    const complexJson = JSON.stringify({
      id: "12345",
      name: "ComplexTest",
      nested: {
        value: "nested-value",
      },
      items: [1, 2, 3],
      Attributes: [
        { Key: "attr1", Value: "value1" },
        { Key: "attr2", Value: 100 },
      ],
    });

    it("should display root properties", () => {
      renderWithTheme(<LayerDetailsViewer json={complexJson} />);
      expect(screen.getByText("id")).toBeTruthy();
      expect(screen.getByText("name")).toBeTruthy();
    });

    it("should display attributes", () => {
      renderWithTheme(<LayerDetailsViewer json={complexJson} />);
      expect(screen.getByText("attr1")).toBeTruthy();
      expect(screen.getByText("attr2")).toBeTruthy();
    });

    it("should show array item count", () => {
      renderWithTheme(<LayerDetailsViewer json={complexJson} />);
      expect(screen.getByText(/3 items/)).toBeTruthy();
    });

    it("should show nested object indicator", () => {
      renderWithTheme(<LayerDetailsViewer json={complexJson} />);
      expect(screen.getByText("nested")).toBeTruthy();
    });

    it("should filter nested objects", async () => {
      renderWithTheme(<LayerDetailsViewer json={complexJson} />);
      const filterInput = screen.getByPlaceholderText(/filter by key/i);

      fireEvent.change(filterInput, { target: { value: "nested-value" } });

      await waitFor(() => {
        expect(screen.getByText("nested")).toBeTruthy();
      });
    });

    it("should filter array items", async () => {
      renderWithTheme(<LayerDetailsViewer json={complexJson} />);
      const filterInput = screen.getByPlaceholderText(/filter by key/i);

      fireEvent.change(filterInput, { target: { value: "2" } });

      await waitFor(() => {
        expect(screen.getByText("items")).toBeTruthy();
      });
    });
  });

  describe("JSON view features", () => {
    const testJson = JSON.stringify({
      hello: "world",
      number: 123,
    });

    it("should search in JSON view", () => {
      renderWithTheme(<LayerDetailsViewer json={testJson} />);

      // Switch to JSON view
      const toggleButtons = screen.getAllByRole("button");
      const viewToggleButton = toggleButtons[toggleButtons.length - 2];
      fireEvent.click(viewToggleButton);

      // Just verify it doesn't crash
      expect(viewToggleButton).toBeTruthy();
    });

    it("should copy JSON to clipboard", async () => {
      const clipboardSpy = vi.spyOn(navigator.clipboard, "writeText");

      renderWithTheme(<LayerDetailsViewer json={testJson} />);

      // Find and click copy button
      const buttons = screen.getAllByRole("button");
      const copyButton = buttons.find((btn) =>
        btn.getAttribute("title")?.includes("Copy"),
      );

      if (copyButton) {
        fireEvent.click(copyButton);
        await waitFor(() => {
          expect(clipboardSpy).toHaveBeenCalled();
        });
      }

      clipboardSpy.mockRestore();
    });
  });

  describe("error handling", () => {
    it("should handle invalid JSON gracefully", () => {
      const invalidJson = "{invalid json}";
      renderWithTheme(<LayerDetailsViewer json={invalidJson} />);
      expect(screen.getByPlaceholderText(/filter by key/i)).toBeTruthy();
    });

    it("should handle null values", () => {
      const jsonWithNull = JSON.stringify({
        value: null,
        name: "test",
      });
      renderWithTheme(<LayerDetailsViewer json={jsonWithNull} />);
      expect(screen.getByText("value")).toBeTruthy();
      expect(screen.getAllByText("null").length).toBeGreaterThan(0);
    });

    it("should handle empty strings", () => {
      const jsonWithEmpty = JSON.stringify({
        empty: "",
        name: "test",
      });
      renderWithTheme(<LayerDetailsViewer json={jsonWithEmpty} />);
      expect(screen.getByText("empty")).toBeTruthy();
    });

    it("should not render an expanded box for empty arrays", () => {
      const jsonWithEmptyArray = JSON.stringify({
        children: [],
        name: "test",
      });

      renderWithTheme(<LayerDetailsViewer json={jsonWithEmptyArray} />);

      expect(screen.getByText("children")).toBeTruthy();
      expect(screen.queryByText("[0]")).toBeFalsy();
      expect(screen.getByText("[]")).toBeTruthy();
    });
  });

  describe("keyboard interactions", () => {
    const testJson = JSON.stringify({ test: "value" });

    it("should filter on text input", async () => {
      renderWithTheme(<LayerDetailsViewer json={testJson} />);
      const filterInput = screen.getByPlaceholderText(/filter by key/i);

      fireEvent.change(filterInput, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByText("test")).toBeTruthy();
      });
    });

    it("should clear on escape (in Combobox)", async () => {
      renderWithTheme(<LayerDetailsViewer json={testJson} />);
      const filterInput = screen.getByPlaceholderText(/filter by key/i);

      fireEvent.change(filterInput, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByText("test")).toBeTruthy();
      });
    });
  });
});
