# Solution Layer Manager

![Solution Layer Manager](https://raw.githubusercontent.com/cyco77/pptb-solution-layer-manager/main/icon/solution-layer-explorer_small.png)

A Power Platform Toolbox (PPTB) tool to inspect Dataverse solution component layers, analyze active customizations, and remove active layers in bulk.

## Screenshots

### Dark Theme

![Solution Layer Manager - Dark Theme](https://raw.githubusercontent.com/cyco77/pptb-solution-layer-manager/main/screenshots/main_dark.png)

### Light Theme

![Solution Layer Manager - Light Theme](https://raw.githubusercontent.com/cyco77/pptb-solution-layer-manager/main/screenshots/main_light.png)

## Features

- Browse solutions in your Dataverse environment
- Filter solutions by:
  - Type (Managed / Unmanaged / All)
  - Visibility (Hidden)
- Review solution options with:
  - Friendly name
  - Version number
  - Managed or unmanaged tag
- Load and browse 130+ Dataverse component types
- See component counts per type and identify which components have active layers
- Load active layers for selected component types
- Review components with active layers in a grid view
- Open a layer drawer for each component to inspect:
  - All available layers
  - Layer order and active layer position
  - Properties JSON
  - Changes JSON
  - Children JSON
- Use the layer details viewer to:
  - Search and filter structured data
  - Switch between structured view and raw JSON
  - Copy full JSON or individual values
  - Review color-coded value types
  - Expand nested objects and arrays
- Remove active layers for:
  - Selected components
  - All loaded components with active layers
- Use Dataverse `BulkRemoveActiveCustomizationsAsync` to remove multiple active customizations in one operation
- Export an active layer report as Markdown

## License

MIT
