import {
  HIERARCHY_DISPLAY,
  HIERARCHY_DISPLAY_TITLE,
  USE_FM_TITLE,
  USE_NOTE_TITLE_FOR_LINK,
} from "../global/global";

/**
 * Namespace for all preview related configurations
 */
export type DendronPreviewConfig = {
  useFMTitle: boolean; // TODO: split
  hierarchyDisplay: boolean; // TODO: split
  hierarchyDisplayTitle: string; // TODO: split
  useNoteTitleForLink: boolean; // TODO: split
};

/**
 * Constants holding all preview config related {@link DendronConfigEntry}
 */
export const PREVIEW = {
  USE_FM_TITLE: USE_FM_TITLE("preview"), // TODO: split
  HIERARCHY_DISPLAY: HIERARCHY_DISPLAY("preview"), // TODO: split
  HIERARHCY_DISPLAY_TITLE: HIERARCHY_DISPLAY_TITLE("preview"), // TODO: split
  USE_NOTE_TITLE_FOR_LINK: USE_NOTE_TITLE_FOR_LINK("preview"), // TODO: split
};

export function genDefaultPreviewConfig(): DendronPreviewConfig {
  return {
    useFMTitle: true, // TODO: split
    hierarchyDisplay: true, // TODO: split
    hierarchyDisplayTitle: "children", // TODO: split
    useNoteTitleForLink: true,
  };
}
