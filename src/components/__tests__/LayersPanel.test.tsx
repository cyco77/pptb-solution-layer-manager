import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { LayersPanel } from "../LayersPanel";
import { ComponentLayer } from "../../types/componentLayer";
import { ComponentWithLayers } from "../../types/solutionComponent";

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <FluentProvider theme={webLightTheme}>{component}</FluentProvider>,
  );
};

const createLayer = (
  id: string,
  solutionName: string,
  overrides: Partial<ComponentLayer> = {},
): ComponentLayer => ({
  msdyn_componentlayerid: id,
  msdyn_componentid: `component-${id}`,
  msdyn_name: `Layer ${id}`,
  msdyn_solutionname: solutionName,
  msdyn_solutioncomponentname: "Test Component",
  msdyn_order: Number(id.replace(/\D/g, "")) || 1,
  msdyn_componentjson: JSON.stringify({ property: `${id}-property` }),
  msdyn_changes: JSON.stringify({ change: `${id}-change` }),
  msdyn_children: JSON.stringify([{ child: `${id}-child` }]),
  ...overrides,
});

const component: ComponentWithLayers = {
  solutioncomponentid: "solution-component-1",
  objectid: "object-1",
  componenttype: 1,
  componenttypeName: "Test Type",
  name: "Test Component",
  layers: null,
};

describe("LayersPanel", () => {
  it("keeps the selected tab when changing layers", () => {
    const layers = [
      createLayer("layer-1", "Active"),
      createLayer("layer-2", "Custom"),
    ];

    renderWithTheme(
      <LayersPanel
        open={true}
        component={component}
        layers={layers}
        isLoading={false}
        onOpenChange={() => {}}
      />, 
    );

    fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
    fireEvent.click(screen.getByText("Custom"));

    expect(
      screen.getByRole("tab", { name: "Changes", selected: true }),
    ).toBeTruthy();
  });

  it("falls back when the selected tab is not available on the new layer", () => {
    const layers = [
      createLayer("layer-1", "Active"),
      createLayer("layer-2", "Custom", { msdyn_changes: undefined }),
    ];

    renderWithTheme(
      <LayersPanel
        open={true}
        component={component}
        layers={layers}
        isLoading={false}
        onOpenChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
    fireEvent.click(screen.getByText("Custom"));

    expect(screen.queryByRole("tab", { name: "Changes" })).toBeFalsy();
    expect(
      screen.getByRole("tab", { name: "Properties", selected: true }),
    ).toBeTruthy();
  });
});
