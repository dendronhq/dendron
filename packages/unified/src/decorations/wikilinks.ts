import {
  containsNonDendronUri,
  DendronError,
  DVault,
  getTextRange,
  IDendronError,
  isNotUndefined,
  NoteProps,
  NotePropsMeta,
  position2VSCodeRange,
  ReducedDEngine,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { AnchorUtils } from "../remark";
import { isBeginBlockAnchorId, isEndBlockAnchorId } from "../remark/noteRefsV2";
import { WikiLinkNoteV4 } from "../types";
import { decorateTaskNote, DecorationTaskNote } from "./taskNotes";
import { Decoration, DECORATION_TYPES, Decorator } from "./utils";

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
  const { node: wikiLink, engine, note, noteText, config } = opts;
  const { position } = wikiLink;

  const fname: string | undefined = wikiLink.value;
  const vaultName = wikiLink.data.vaultName;

  const { type, errors } = await linkedNoteType({
    fname,
    anchorStart: wikiLink.data.anchorHeader,
    vaultName,
    note,
    engine,
    vaults: config.workspace?.vaults ?? config.vaults ?? [],
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
    const taskDecoration = await decorateTaskNote({
      range: wikilinkRange,
      fname,
      vaultName,
      engine,
      config,
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
  // if it's a ^begin or ^end, it's valid;
  if (anchor && isBeginBlockAnchorId(anchor.slice(1))) return true;
  if (anchor && isEndBlockAnchorId(anchor.slice(1))) return true;
  // wildcard header anchor or line anchor. These are hard to check, so let's just say they exist.
  if (anchor && /^[*L]/.test(anchor)) return true;
  // otherwise, check that the anchor actually exists inside the note
  return allAnchors.includes(anchor.toLowerCase());
}

export async function linkedNoteType({
  fname,
  anchorStart,
  anchorEnd,
  vaultName,
  note,
  engine,
  vaults,
}: {
  fname?: string;
  anchorStart?: string;
  anchorEnd?: string;
  vaultName?: string;
  note?: NoteProps;
  engine: ReducedDEngine;
  vaults: DVault[];
}): Promise<{
  type: DECORATION_TYPES.brokenWikilink | DECORATION_TYPES.wikiLink;
  errors: IDendronError[];
}> {
  const ctx = "linkedNoteType";
  // const { vaults } = engine;
  const vault = vaultName
    ? VaultUtils.getVaultByName({ vname: vaultName, vaults })
    : undefined;
  // Vault specified, but can't find it.
  if (vaultName && !vault)
    return {
      type: DECORATION_TYPES.brokenWikilink,
      errors: [],
    };

  let matchingNotes: NotePropsMeta[];
  // Same-file links have `fname` undefined or empty string
  if (!fname && note) {
    matchingNotes = note ? [note] : [];
  } else if (fname) {
    try {
      matchingNotes = await engine.findNotesMeta({ fname, vault });
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

  // It's hard to check the anchors for non-note files because we don't parse
  // them ahead of time. If we can find the file, just say the link is good
  // without checking anchors.
  // TODO: Re-enable check once we can refactor out common-server dependency:
  // if (fname && matchingNotes.length === 0) {
  // const nonNoteFile = await findNonNoteFile({
  //   fpath: fname,
  //   vaults: engine.vaults,
  //   wsRoot: engine.wsRoot,
  // });
  // if (nonNoteFile) return { type: DECORATION_TYPES.wikiLink, errors: [] };
  // return { type: DECORATION_TYPES.wikiLink, errors: [] };
  // }

  // For regular notes, we can efficiently check the anchors.
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
    // There are no anchors specified in the link, but we did find matching notes
    return { type: DECORATION_TYPES.wikiLink, errors: [] };
  }
  // No matching notes, and not a non-note file or web URL. This is just a broken link then.
  return { type: DECORATION_TYPES.brokenWikilink, errors: [] };
}
