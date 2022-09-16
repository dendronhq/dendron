import { position2VSCodeRange } from "@dendronhq/common-all";
import { UserTag } from "../types";
import { Decorator } from "./utils";
import { DecorationWikilink, linkedNoteType } from "./wikilinks";

export const decorateUserTag: Decorator<UserTag, DecorationWikilink> = async (
  opts
) => {
  const { node: userTag, engine, config } = opts;
  const position = userTag.position;

  const { type, errors } = await linkedNoteType({
    fname: userTag.fname,
    engine,
    vaults: config.workspace?.vaults ?? config.vaults ?? [],
  });

  const decoration: DecorationWikilink = {
    type,
    range: position2VSCodeRange(position),
  };

  return {
    decorations: [decoration],
    errors,
  };
};
