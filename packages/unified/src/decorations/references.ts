import { position2VSCodeRange, DECORATION_TYPES } from "@dendronhq/common-all";
import { NoteRefNoteV4 } from "../types";
import { Decorator } from "./utils";
import { DecorationWikilink, linkedNoteType } from "./wikilinks";

export const decorateReference: Decorator<
  NoteRefNoteV4,
  DecorationWikilink
> = async (opts) => {
  const { node: reference, engine, note, config } = opts;
  const { position } = reference;

  const { errors, noteMeta, type } = await linkedNoteType({
    fname: reference.data.link.from.fname,
    anchorStart: reference.data.link.data.anchorStart,
    anchorEnd: reference.data.link.data.anchorEnd,
    vaultName: reference.data.link.data.vaultName,
    engine,
    note,
    vaults: config.workspace?.vaults ?? [],
  });

  const decorationType =
    type === DECORATION_TYPES.brokenWikilink
      ? DECORATION_TYPES.brokenNoteRef
      : DECORATION_TYPES.noteRef;
  const decoration: DecorationWikilink = {
    type: decorationType,
    range: position2VSCodeRange(position),
    data: {
      link: reference.data.link,
      noteMeta,
    },
  };

  return { errors, decorations: [decoration] };
};
