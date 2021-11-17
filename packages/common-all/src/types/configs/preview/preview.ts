/**
 * Namespace for all preview related configurations
 */
export type DendronPreviewConfig = {
  enableFMTitle: boolean; // TODO: split
  enableHierarchyDisplay: boolean; // TODO: split
  hierarchyDisplayTitle?: string; // TODO: split
  enableNoteTitleForLink: boolean; // TODO: split
  enableMermaid: boolean;
  enablePrettyRefs: boolean;
  enableKatex: boolean;
};

/**
 * Generate defaults for {@link DendronPreviewConfig}
 * @returns DendronPreviewConfig
 */
export function genDefaultPreviewConfig(): DendronPreviewConfig {
  return {
    enableFMTitle: true,
    enableHierarchyDisplay: true,
    hierarchyDisplayTitle: "Children",
    enableNoteTitleForLink: true,
    enableMermaid: true,
    enablePrettyRefs: true,
    enableKatex: true,
  };
}
