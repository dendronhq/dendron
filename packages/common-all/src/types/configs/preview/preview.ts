/**
 * Namespace for all preview related configurations
 */
export type DendronPreviewConfig = {
  enableFMTitle?: boolean; // TODO: split
  enableHierarchyDisplay?: boolean; // TODO: split
  hierarchyDisplayTitle?: string; // TODO: split
  enableNoteTitleForLink?: boolean; // TODO: split
  enableMermaid?: boolean;
  enableNunjucks?: boolean;
  enablePrettyRefs?: boolean;
  enableKatex?: boolean;
  enableLegacyNoteRef?: boolean;
};

/**
 * Generate defaults for {@link DendronPreviewConfig}
 * @returns DendronPreviewConfig
 */
export function genDefaultPreviewConfig(): DendronPreviewConfig {
  return {};
}
