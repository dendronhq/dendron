import { DendronConfigEntryCollection } from "../../types/configs/base";
import { DendronPreviewConfig } from "../../types/configs/preview/preview";
import {
  ENABLE_HIERARCHY_DISPLAY,
  HIERARCHY_DISPLAY_TITLE,
  ENABLE_FM_TITLE,
  ENABLE_NOTE_TITLE_FOR_LINK,
  ENABLE_MERMAID,
  ENABLE_KATEX,
  ENABLE_PRETTY_REFS,
} from "./global";

export const PREVIEW: DendronConfigEntryCollection<DendronPreviewConfig> = {
  enableFMTitle: ENABLE_FM_TITLE("preview"), // TODO: split
  enableHierarchyDisplay: ENABLE_HIERARCHY_DISPLAY("preview"), // TODO: split
  hierarchyDisplayTitle: HIERARCHY_DISPLAY_TITLE("preview"), // TODO: split
  enableNoteTitleForLink: ENABLE_NOTE_TITLE_FOR_LINK("preview"), // TODO: split
  enableMermaid: ENABLE_MERMAID("preview"),
  enablePrettyRefs: ENABLE_PRETTY_REFS("preview"),
  enableKatex: ENABLE_KATEX("preview"),
};
