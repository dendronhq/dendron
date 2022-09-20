import { Theme } from "../publishing";

/**
 * Namespace for all preview related configurations
 */
export type DendronPreviewConfig = {
  enableFMTitle: boolean; // TODO: split
  enableNoteTitleForLink: boolean; // TODO: split
  enableFrontmatterTags: boolean;
  enableHashesForFMTags: boolean;
  enablePrettyRefs: boolean;
  enableKatex: boolean;
  automaticallyShowPreview: boolean;
  theme?: Theme;
};

/**
 * Generate defaults for {@link DendronPreviewConfig}
 * @returns DendronPreviewConfig
 */
export function genDefaultPreviewConfig(): DendronPreviewConfig {
  return {
    enableFMTitle: true,
    enableNoteTitleForLink: true,
    enableFrontmatterTags: true,
    enableHashesForFMTags: false,
    enablePrettyRefs: true,
    enableKatex: true,
    automaticallyShowPreview: false,
  };
}
