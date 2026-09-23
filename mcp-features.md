# MCP Features

Solution Layer Manager exposes the following headless MCP operations:

- `loadSolutionComponents`: loads the solution components for a solution.
- `loadActiveLayers`: loads the active layers for the selected component types.
- `loadActiveLayerChanges`: returns the changes stored on the active layers.
- `resolveUser`: resolves a Dataverse system user from its `systemuserid`.

## Input

Every operation requires one of `solutionId`, `solutionName`, or
`solutionUniqueName`. `solutionName` and `solutionUniqueName` are matched
case-insensitively while ignoring spaces, hyphens, and underscores.

`resolveUser` is the exception: it requires `userId` instead of a solution
selector and returns the user record, or `user: null` if no matching user
exists.

For layer operations, every entry in `changes` includes `changedBy` and
`changedByName`. The latter is resolved from the user ID stored in the change
payload and is `null` when the payload does not contain a recognizable user ID
or the user no longer exists.

Optional filters:

- `componentTypes`: numeric Dataverse solution component type values.
- `componentTypeNames`: component type names such as `Entity` or `Workflow`.
- `componentIds`: Dataverse component object IDs.

## Response

The response contains `status`, `operation`, `solutionId`, and `components`.
Each component includes its component type and, for the layer operations,
`activeLayers`. `loadActiveLayerChanges` additionally includes a compact
`changes` array containing the parsed `msdyn_changes` payload for each active
layer.

The headless bundle is built as `dist/headless.js`. After changing the MCP
contract, reinstall or update the tool in Power Platform ToolBox so discovery
uses the new `pptb.config.json`.
