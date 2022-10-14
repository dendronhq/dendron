import { VSRange } from "./compat";

/** Lists all known decoration types. */
export enum DECORATION_TYPES {
  timestamp = "timestamp",
  blockAnchor = "blockAnchor",
  wikiLink = "wikiLink",
  brokenWikilink = "brokenWikilink",
  noteRef = "noteRef",
  alias = "alias",
  taskNote = "taskNote",
}

export type Decoration = {
  type: DECORATION_TYPES;
  range: VSRange;
};
