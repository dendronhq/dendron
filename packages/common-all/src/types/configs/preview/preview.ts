import {
  HIERARCHY_DISPLAY,
  HIERARCHY_DISPLAY_TITLE,
  USE_FM_TITLE,
  USE_NOTE_TITLE_FOR_LINK,
  MERMAID,
  USE_NUNJUCKS,
  USE_KATEX,
  USE_PRETTY_REFS,
  NO_LEGACY_NOTE_REF,
} from "../global/global";

/**
 * Namespace for all preview related configurations
 */
export type DendronPreviewConfig = {
  useFMTitle: boolean; // TODO: split
  hierarchyDisplay: boolean; // TODO: split
  hierarchyDisplayTitle: string; // TODO: split
  useNoteTitleForLink: boolean; // TODO: split
  mermaid: boolean;
  useNunjucks: boolean;
  usePrettyRefs: boolean;
  useKatex: boolean;
  noLegacyNoteRef: boolean;
};

/**
 * Constants holding all preview config related {@link DendronConfigEntry}
 */
export const PREVIEW = {
  USE_FM_TITLE: USE_FM_TITLE("preview"), // TODO: split
  HIERARCHY_DISPLAY: HIERARCHY_DISPLAY("preview"), // TODO: split
  HIERARHCY_DISPLAY_TITLE: HIERARCHY_DISPLAY_TITLE("preview"), // TODO: split
  USE_NOTE_TITLE_FOR_LINK: USE_NOTE_TITLE_FOR_LINK("preview"), // TODO: split
  MERMAID: MERMAID("preview"),
  USE_NUNJUCKS: USE_NUNJUCKS("preview"),
  USE_PRETTY_REFS: USE_PRETTY_REFS("preview"),
  USE_KATEX: USE_KATEX("preview"),
  NO_LEGACY_NOTE_REF: NO_LEGACY_NOTE_REF("preview"),
};

export function genDefaultPreviewConfig(): DendronPreviewConfig {
  return {
    useFMTitle: true, // TODO: split
    hierarchyDisplay: true, // TODO: split
    hierarchyDisplayTitle: "children", // TODO: split
    useNoteTitleForLink: true,
    mermaid: true,
    useKatex: true,
    useNunjucks: false,
    usePrettyRefs: true,
    noLegacyNoteRef: true,
  };
}
