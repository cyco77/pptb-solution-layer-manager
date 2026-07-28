/**
 * Dataverse component type metadata interface.
 * Used throughout the application for component type lookups and metadata.
 */

export interface ComponentType {
  solutioncomponenttype: number;
  name: string; // Display name (e.g., "Workflow")
  layerName: string; // msdyn_solutioncomponentname for layer queries
  entityLogicalName?: string; // Entity schema name for Dataverse API (lowercase)
  tableName?: string; // Table name for querying entity records
  idField?: string; // ID field name in the entity table
  displayField?: string; // Display field name in the entity table
}
