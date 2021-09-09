import {
  HIERARCHY_DISPLAY,
  HIERARCHY_DISPLAY_TITLE,
  USE_FM_TITLE,
  USE_NOTE_TITLE_FOR_LINK,
} from "../global/global";

/**
 * Namespace for all publishing related configurations
 */
export type DendronPublishingConfig = {
  useFMTitle: boolean; // TODO: split implementation to respect non-global config
  hierarchyDisplay: boolean; // TODO: split
  hierarchyDisplayTitle: string; // TODO: split
  useNoteTitleForLink: boolean; // TODO: split
};

/**
 * Constants holding all publishing config related {@link DendronConfigEntry}
 */
export const PUBLISHING = {
  USE_FM_TITLE: USE_FM_TITLE("publishing"), // TODO: split implementation to respect non-global config
  HIERARCHY_DISPLAY: HIERARCHY_DISPLAY("publishing"), // TODO: split
  HIERARCHY_DISPLAY_TITLE: HIERARCHY_DISPLAY_TITLE("publishing"), // TODO: split
  USE_NOTE_TITLE_FOR_LINK: USE_NOTE_TITLE_FOR_LINK("publishing"), // TODO: split
};

export function genDefaultPublishingConfig(): DendronPublishingConfig {
  return {
    useFMTitle: true, // TODO: split implementation to respect non-global config
    hierarchyDisplay: true, // TODO: split
    hierarchyDisplayTitle: "children", // TODO: split
    useNoteTitleForLink: true, // TODO: split
  };
}
