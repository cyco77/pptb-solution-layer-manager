import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { ActiveLayersTree } from "../ActiveLayersTree";
import { ComponentWithLayers } from "../../types/solutionComponent";

const component: ComponentWithLayers = {
  solutioncomponentid: "solution-component-1",
  objectid: "component-1",
  componenttype: 1,
  componenttypeName: "Table",
  name: "Account",
  layers: [
    {
      msdyn_componentlayerid: "layer-1",
      msdyn_componentid: "component-1",
      msdyn_name: "Account",
      msdyn_solutionname: "Active",
      msdyn_solutioncomponentname: "Entity",
      msdyn_order: 1,
    },
  ],
};

describe("ActiveLayersTree", () => {
  it("shows active components as collapsible child rows with details action", () => {
    const onOpenDetails = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <ActiveLayersTree
          groups={[{ typeName: "Table", components: [component] }]}
          onOpenDetails={onOpenDetails}
          onDeleteSelected={vi.fn()}
        />
      </FluentProvider>,
    );

    expect(
      screen
        .getByRole("treeitem", { name: /Table 1/ })
        .getAttribute("aria-level"),
    ).toBe("1");
    expect(
      screen
        .getByRole("treeitem", { name: /Select Account Account Active/ })
        .getAttribute("aria-level"),
    ).toBe("2");
    expect(screen.getByText("Account")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    const group = screen.getByRole("treeitem", { name: /Table 1/ });
    fireEvent.click(group);
    expect(group.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Account")).toBeNull();
    fireEvent.click(group);
    expect(group.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(
      screen.getByRole("button", { name: "Show details for Account" }),
    );
    expect(onOpenDetails).toHaveBeenCalledWith("solution-component-1");
  });
});
