import { VSRange } from "./compat";

/** Lists all known decoration types. */
export enum DECORATION_TYPES {
  timestamp = "timestamp",
  blockAnchor = "blockAnchor",
  wikiLink = "wikiLink",
  brokenWikilink = "brokenWikilink",
  alias = "alias",
  taskNote = "taskNote",
}

export type Decoration = {
  type: DECORATION_TYPES;
  range: VSRange;
};
