import { Decoration, DECORATION_TYPES, Decorator } from "./utils";
import {
  containsNonDendronUri,
  DendronError,
  DEngine,
  DEngineClient,
  getTextRange,
  IDendronError,
  isNotUndefined,
  NoteProps,
  NoteUtils,
  position2VSCodeRange,
  VaultUtils,
} from "@dendronhq/common-all";
import { AnchorUtils } from "../remark";
import _ from "lodash";
import { WikiLinkNoteV4 } from "../types";
import { decorateTaskNote, DecorationTaskNote } from "./taskNotes";
import { findNonNoteFile } from "@dendronhq/common-server";

export type DecorationWikilink = Decoration & {
  type: DECORATION_TYPES.wikiLink | DECORATION_TYPES.brokenWikilink;
};
export type DecorationAlias = Decoration & {
  type: DECORATION_TYPES.alias;
};

const RE_ALIAS = /(?<beforeAlias>\[\[)(?<alias>[^|]+)\|/;

type DecorationsForDecorateWikilink =
  | DecorationWikilink
  | DecorationAlias
  | DecorationTaskNote;

export const decorateWikilink: Decorator<
  WikiLinkNoteV4,
  DecorationsForDecorateWikilink
> = async (opts) => {
  const { node: wikiLink, engine, note, noteText } = opts;
  const { position } = wikiLink;

  const fname: string | undefined = wikiLink.value;
  const vaultName = wikiLink.data.vaultName;

  const { type, errors } = await linkedNoteType({
    fname,
    anchorStart: wikiLink.data.anchorHeader,
    vaultName,
    note,
    engine,
  });
  const wikilinkRange = position2VSCodeRange(position);
  const decorations: DecorationsForDecorateWikilink[] = [];

  // Highlight the alias part
  const linkText = getTextRange(noteText, wikilinkRange);
  const aliasMatch = linkText.match(RE_ALIAS);
  if (
    aliasMatch &&
    aliasMatch.groups?.beforeAlias &&
    aliasMatch.groups?.alias
  ) {
    const { beforeAlias, alias } = aliasMatch.groups;
    decorations.push({
      type: DECORATION_TYPES.alias,
      range: {
        start: {
          line: wikilinkRange.start.line,
          character: wikilinkRange.start.character + beforeAlias.length,
        },
        end: {
          line: wikilinkRange.start.line,
          character:
            wikilinkRange.start.character + beforeAlias.length + alias.length,
        },
      },
    });
  }

  // Wikilinks to a part of a task are not tasks themselves, so skip links like [[task.thing#part]]. Also skip broken wikilinks, they have no notes.
  if (!wikiLink.data.anchorHeader && type !== DECORATION_TYPES.brokenWikilink) {
    const taskDecoration = decorateTaskNote({
      range: wikilinkRange,
      fname,
      vaultName,
      engine,
    });
    if (taskDecoration) decorations.push(taskDecoration);
  }

  // Highlight the wikilink itself
  decorations.push({ type, range: wikilinkRange });
  return { decorations, errors };
};

function checkIfAnchorIsValid({
  anchor,
  allAnchors,
}: {
  anchor?: string;
  allAnchors: string[];
}): boolean {
  // if there's no anchor, there's nothing that could be invalid
  if (!anchor) return true;
  // wildcard header anchor or line anchor. These are hard to check, so let's just say they exist.
  if (anchor && /^[*L]/.test(anchor)) return true;
  // otherwise, check that the anchor actually exists inside the note
  return allAnchors.includes(anchor);
}

export async function linkedNoteType({
  fname,
  anchorStart,
  anchorEnd,
  vaultName,
  note,
  engine,
}: {
  fname?: string;
  anchorStart?: string;
  anchorEnd?: string;
  vaultName?: string;
  note?: NoteProps;
  engine: DEngine | DEngineClient;
}): Promise<{
  type: DECORATION_TYPES.brokenWikilink | DECORATION_TYPES.wikiLink;
  errors: IDendronError[];
}> {
  const ctx = "linkedNoteType";
  const { vaults } = engine;
  const vault = vaultName
    ? VaultUtils.getVaultByName({ vname: vaultName, vaults })
    : undefined;
  // Vault specified, but can't find it.
  if (vaultName && !vault)
    return {
      type: DECORATION_TYPES.brokenWikilink,
      errors: [],
    };

  let matchingNotes: NoteProps[];
  // Same-file links have `fname` undefined or empty string
  if (!fname && note) {
    matchingNotes = note ? [note] : [];
  } else if (fname) {
    try {
      matchingNotes = NoteUtils.getNotesByFnameV2({
        fname,
        vault,
        engine,
      });
    } catch (err) {
      return {
        type: DECORATION_TYPES.brokenWikilink,
        errors: [
          new DendronError({
            message: "error when looking for note",
            payload: {
              ctx,
              fname,
              vaultName,
              err,
            },
          }),
        ],
      };
    }
  } else {
    matchingNotes = [note!];
  }

  // Checking web URLs is not feasible, and checking wildcard references would be hard.
  // Let's just highlight them as existing for now.
  if (fname && (containsNonDendronUri(fname) || fname.endsWith("*")))
    return { type: DECORATION_TYPES.wikiLink, errors: [] };

  if (anchorStart || anchorEnd) {
    const allAnchors = _.flatMap(matchingNotes, (note) =>
      Object.values(note.anchors)
    )
      .filter(isNotUndefined)
      .map(AnchorUtils.anchor2string);
    if (!checkIfAnchorIsValid({ anchor: anchorStart, allAnchors }))
      return { type: DECORATION_TYPES.brokenWikilink, errors: [] };
    if (!checkIfAnchorIsValid({ anchor: anchorEnd, allAnchors }))
      return { type: DECORATION_TYPES.brokenWikilink, errors: [] };
  }

  if (matchingNotes.length > 0) {
    return { type: DECORATION_TYPES.wikiLink, errors: [] };
  }
  // Could be a non-note file too
  if (fname) {
    const nonNoteFile = await findNonNoteFile({
      fpath: fname,
      vaults: engine.vaults,
      wsRoot: engine.wsRoot,
    });
    if (nonNoteFile) return { type: DECORATION_TYPES.wikiLink, errors: [] };
  }
  //
  return { type: DECORATION_TYPES.brokenWikilink, errors: [] };
}
