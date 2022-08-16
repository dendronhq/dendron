/** "line" uses line numbers (`L23`), "block" inserts block anchors (`^xf1g...`). "prompt" means prompt the user to select one. */
export type NonNoteFileLinkAnchorType = "line" | "block" | "prompt";

/**
 * Namespace for configuring {@link CopyNoteLinkCommand}
 */
export type CopyNoteLinkConfig = {
  nonNoteFile?: {
    anchorType?: NonNoteFileLinkAnchorType;
  };
  aliasMode: "none" | "title";
};

export function genDefaultCopyNoteLinkConfig(): CopyNoteLinkConfig {
  // don't set a default for `nonNoteFiles`, we want to prompt the user whether they want lines or block anchors
  return { aliasMode: "title" };
}
