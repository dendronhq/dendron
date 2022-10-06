/**
 * Pod Types that work with the V2 workflow
 */
export enum PodV2Types {
  AirtableExportV2 = "AirtableExportV2",
  MarkdownExportV2 = "MarkdownExportV2",
  GoogleDocsExportV2 = "GoogleDocsExportV2",
  NotionExportV2 = "NotionExportV2",
  JSONExportV2 = "JSONExportV2",
}

/**
 * Specifies what information to export
 */
export enum PodExportScope {
  Note = "Note",
  Lookup = "Lookup",
  Selection = "Selection",
  Hierarchy = "Hierarchy",
  Vault = "Vault",
  Workspace = "Workspace",
  LinksInSelection = "LinksInSelection",
}

/**
 * Base configuration for v2 export pods
 */
export type ExportPodConfigurationV2 = {
  /**
   * Unique ID to identify the pod configuration
   */
  podId: string;

  /**
   * The type of Pod this configuration is meant for
   */
  podType: PodV2Types;

  /**
   * An optional description of the pod configuration. This will show up in UI
   * controls when a user is selecting a pod configuration to run.
   */
  description?: string;

  /**
   * Specifies the scope of this export operation
   */
  exportScope: PodExportScope;
};

/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link ExportPodConfigurationV2}
 * @param object
 * @returns
 */
export function isExportPodConfigurationV2(
  object: any
): object is ExportPodConfigurationV2 {
  return (
    object !== undefined &&
    "podId" in object &&
    "podType" in object &&
    "exportScope" in object
  );
}

/**
 * Contains only the common parameters required during execution of the export
 * pod.
 */
export type RunnablePodConfigV2 = Pick<ExportPodConfigurationV2, "exportScope">;
