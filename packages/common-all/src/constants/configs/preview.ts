import { DendronConfigEntryCollection } from "../../types/configs/base";
import { DendronPreviewConfig } from "../../types/configs/preview/preview";
import {
  ENABLE_FM_TITLE,
  ENABLE_NOTE_TITLE_FOR_LINK,
  ENABLE_MERMAID,
  ENABLE_KATEX,
  ENABLE_PRETTY_REFS,
  ENABLE_FRONTMATTER_TAGS,
  ENABLE_HASHES_FOR_FM_TAGS,
} from "./global";

export const PREVIEW: DendronConfigEntryCollection<DendronPreviewConfig> = {
  enableFMTitle: ENABLE_FM_TITLE("preview"), // TODO: split
  enableNoteTitleForLink: ENABLE_NOTE_TITLE_FOR_LINK("preview"), // TODO: split
  enableFrontmatterTags: ENABLE_FRONTMATTER_TAGS("preview"),
  enableHashesForFMTags: ENABLE_HASHES_FOR_FM_TAGS("preview"),
  enableMermaid: ENABLE_MERMAID("preview"),
  enablePrettyRefs: ENABLE_PRETTY_REFS("preview"),
  enableKatex: ENABLE_KATEX("preview"),
  automaticallyShowPreview: {
    label: "Automatically Show Preview",
    desc: "Automatically show preview when opening VSCode and switching between notes.",
  },
};
