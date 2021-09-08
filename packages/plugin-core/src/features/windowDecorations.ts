import {
  DefaultMap,
  isNotUndefined,
  NoteProps,
  NoteUtils,
  Position,
  TAGS_HIERARCHY,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  AnchorUtils,
  BlockAnchor,
  DendronASTDest,
  DendronASTTypes,
  HashTag,
  MDUtilsV5,
  NoteRefNoteV4,
  ProcMode,
  UserTag,
  WikiLinkNoteV4,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { DateTime } from "luxon";
import { FrontmatterContent } from "mdast";
import visit from "unist-util-visit";
import {
  DecorationOptions,
  DecorationRangeBehavior,
  Diagnostic,
  Range,
  TextDocument,
  TextEditor,
  TextEditorDecorationType,
  ThemeColor,
  window,
} from "vscode";
import { Logger } from "../logger";
import { CodeConfigKeys, DateTimeFormat } from "../types";
import { VSCodeUtils } from "../utils";
import { containsNonDendronUri } from "../utils/md";
import { getFrontmatterTags, parseFrontmatter } from "../utils/yaml";
import { getConfigValue, getDWorkspace } from "../workspace";
import {
  warnBadFrontmatterContents,
  warnMissingFrontmatter,
} from "./codeActionProvider";

const DECORATION_UPDATE_DELAY = 100;

export const DECORATION_TYPE = {
  timestamp: window.createTextEditorDecorationType({}),
  blockAnchor: window.createTextEditorDecorationType({
    opacity: "40%",
    rangeBehavior: DecorationRangeBehavior.ClosedOpen,
  }),
  /** Decoration for wikilinks that point to valid notes. */
  wikiLink: window.createTextEditorDecorationType({
    color: new ThemeColor("editorLink.activeForeground"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  /** Decoration for wikilinks that do *not* point to valid notes (e.g. broken). */
  brokenWikilink: window.createTextEditorDecorationType({
    color: new ThemeColor("editorWarning.foreground"),
    backgroundColor: new ThemeColor("editorWarning.background"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  /** Decoration for the alias part of wikilinks. */
  alias: window.createTextEditorDecorationType({
    fontStyle: "italic",
  }),
};

export const DECORATOR = new Map<
  string,
  (node: any, document: TextDocument) => DecorationAndType[]
>([
  [DendronASTTypes.FRONTMATTER, decorateFrontmatter],
  [DendronASTTypes.BLOCK_ANCHOR, decorateBlockAnchor],
  [DendronASTTypes.HASHTAG, decorateHashTag],
  [DendronASTTypes.USERTAG, decorateUserTag],
  [DendronASTTypes.WIKI_LINK, decorateWikiLink],
  [DendronASTTypes.REF_LINK_V2, decorateReference],
  [DendronASTTypes.REF_LINK, decorateReference],
]);

export type DecorationAndType = {
  type: TextEditorDecorationType;
  decoration: DecorationOptions;
};

export function delayedUpdateDecorations(
  updateDelay: number = DECORATION_UPDATE_DELAY
) {
  const beforeTimerPath =
    VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
  setTimeout(() => {
    const editor = VSCodeUtils.getActiveTextEditor();
    // Avoid running this if the same document is no longer open
    if (editor && editor.document.uri.fsPath === beforeTimerPath) {
      try {
        updateDecorations(editor);
      } catch (error) {
        Logger.info({ ctx: "delayedUpdateDecorations", error });
      }
    }
  }, updateDelay);
}

export function updateDecorations(activeEditor: TextEditor) {
  const ctx = "updateDecorations";
  const text = activeEditor.document.getText();
  // Only show decorations & warnings for notes
  try {
    if (_.isUndefined(VSCodeUtils.getNoteFromDocument(activeEditor.document)))
      return {};
  } catch (error) {
    Logger.info({
      ctx,
      msg: "Unable to check if decorations should be updated",
      error,
    });
    return {};
  }
  const proc = MDUtilsV5.procRemarkParse(
    {
      mode: ProcMode.NO_DATA,
      parseOnly: true,
    },
    { dest: DendronASTDest.MD_DENDRON }
  );
  const tree = proc.parse(text);
  const activeDecorations = new DefaultMap<
    TextEditorDecorationType,
    DecorationOptions[]
  >(() => []);
  let frontmatter: FrontmatterContent | undefined;

  visit(tree, (node) => {
    const decorator = DECORATOR.get(node.type);
    if (decorator) {
      const decorations = decorator(node, activeEditor.document);
      for (const { type, decoration } of decorations) {
        activeDecorations.get(type).push(decoration);
      }
    }
    if (node.type === DendronASTTypes.FRONTMATTER)
      frontmatter = node as FrontmatterContent;
  });

  // Warn for missing or bad frontmatter
  const allWarnings: Diagnostic[] = [];
  if (_.isUndefined(frontmatter)) {
    allWarnings.push(warnMissingFrontmatter(activeEditor.document));
  } else {
    allWarnings.push(
      ...warnBadFrontmatterContents(activeEditor.document, frontmatter)
    );
  }

  // Activate the decorations
  Logger.info({
    ctx,
    msg: `Displaying ${allWarnings.length} warnings and ${activeDecorations.size} decorations`,
  });
  for (const [type, decorations] of activeDecorations.entries()) {
    activeEditor.setDecorations(type, decorations);
  }

  // Clear out any old decorations left over from last pass
  for (const type of _.values(DECORATION_TYPE)) {
    if (!activeDecorations.has(type)) {
      activeEditor.setDecorations(type, []);
    }
  }
  return { allDecorations: activeDecorations, allWarnings };
}

function decorateFrontmatter(
  frontmatter: FrontmatterContent
): DecorationAndType[] {
  const { value: contents, position } = frontmatter;
  if (_.isUndefined(position)) return []; // should never happen
  // Decorate the timestamps
  const tsConfig = getConfigValue(
    CodeConfigKeys.DEFAULT_TIMESTAMP_DECORATION_FORMAT
  ) as DateTimeFormat;
  const formatOption = DateTime[tsConfig];

  const entries = contents.split("\n");
  const lineOffset =
    VSCodeUtils.point2VSCodePosition(position.start).line +
    1; /* `---` line of frontmatter */
  const timestampDecorations = entries
    .map((entry, line): undefined | DecorationAndType => {
      const match = NoteUtils.RE_FM_UPDATED_OR_CREATED.exec(entry);
      if (!_.isNull(match) && match.groups?.timestamp) {
        const timestamp = DateTime.fromMillis(
          _.toInteger(match.groups.timestamp)
        );
        const decoration: DecorationOptions = {
          range: new Range(
            line + lineOffset,
            match.groups.beforeTimestamp.length,
            line + lineOffset,
            match.groups.beforeTimestamp.length + match.groups.timestamp.length
          ),
          renderOptions: {
            after: {
              contentText: `  (${timestamp.toLocaleString(formatOption)})`,
            },
          },
        };
        return { type: DECORATION_TYPE.timestamp, decoration };
      }
      return undefined;
    })
    .filter(isNotUndefined);

  // Decorate the frontmatter tags
  const tags = getFrontmatterTags(parseFrontmatter(contents));
  const fmTagDecorations = _.flatMap(tags, (tag) =>
    decorateTag({
      fname: `${TAGS_HIERARCHY}${tag.value}`,
      position: tag.position,
      lineOffset,
    })
  );
  return _.concat(timestampDecorations, fmTagDecorations);
}

function decorateBlockAnchor(blockAnchor: BlockAnchor) {
  const position = blockAnchor.position;
  if (_.isUndefined(position)) return []; // should never happen

  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };
  return [{ type: DECORATION_TYPE.blockAnchor, decoration }];
}

function decorateHashTag(hashtag: HashTag) {
  const position = hashtag.position;
  if (_.isUndefined(position)) return []; // should never happen

  return decorateTag({ fname: hashtag.fname, position });
}

function decorateTag({
  fname,
  position,
  lineOffset,
}: {
  fname: string;
  position: Position;
  lineOffset?: number;
}) {
  const { color: backgroundColor } = NoteUtils.color({
    fname,
    notes: getDWorkspace().engine.notes,
  });

  const type = linkedNoteType({ fname });
  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position, { line: lineOffset }),
    renderOptions: {
      before: {
        contentText: " ",
        width: "0.8rem",
        height: "0.8rem",
        margin: "auto 0.2rem",
        border: "1px solid",
        borderColor: new ThemeColor("foreground"),
        backgroundColor,
      },
    },
  };

  return [{ type, decoration }];
}

function linkedNoteType({
  fname,
  anchorStart,
  anchorEnd,
  vaultName,
  document,
}: {
  fname: string;
  anchorStart?: string;
  anchorEnd?: string;
  vaultName?: string;
  document?: TextDocument;
}) {
  const ctx = "linkedNoteType";
  const { notes, vaults } = getDWorkspace().engine;
  const vault = vaultName
    ? VaultUtils.getVaultByName({ vname: vaultName, vaults })
    : undefined;
  // Vault specified, but can't find it.
  if (vaultName && !vault) return DECORATION_TYPE.brokenWikilink;

  let matchingNotes: NoteProps[];
  // Same-file links have `fname` undefined or empty string
  if (!fname && document) {
    const documentNote = VSCodeUtils.getNoteFromDocument(document);
    matchingNotes = documentNote ? [documentNote] : [];
  } else {
    try {
      matchingNotes = NoteUtils.getNotesByFname({
        fname,
        vault,
        notes,
      });
    } catch (err) {
      Logger.info({
        ctx,
        msg: "error when looking for note",
        fname,
        vaultName,
        err,
      });
      return DECORATION_TYPE.brokenWikilink;
    }
  }

  if (anchorStart || anchorEnd) {
    const allAnchors = _.flatMap(matchingNotes, (note) =>
      Object.values(note.anchors)
    )
      .filter(isNotUndefined)
      .map(AnchorUtils.anchor2string);
    if (anchorStart && anchorStart !== "*" && !allAnchors.includes(anchorStart))
      return DECORATION_TYPE.brokenWikilink;
    if (anchorEnd && anchorEnd !== "*" && !allAnchors.includes(anchorEnd))
      return DECORATION_TYPE.brokenWikilink;
  }

  if (
    matchingNotes.length > 0 ||
    containsNonDendronUri(fname) ||
    fname.endsWith("*")
  )
    return DECORATION_TYPE.wikiLink;
  else return DECORATION_TYPE.brokenWikilink;
}

const RE_ALIAS = /(?<beforeAlias>\[\[)(?<alias>[^|]+)\|/;

function decorateWikiLink(wikiLink: WikiLinkNoteV4, document: TextDocument) {
  const position = wikiLink.position as Position | undefined;
  if (_.isUndefined(position)) return []; // should never happen

  const type = linkedNoteType({
    fname: wikiLink.value,
    anchorStart: wikiLink.data.anchorHeader,
    vaultName: wikiLink.data.vaultName,
    document,
  });
  const wikiLinkrange = VSCodeUtils.position2VSCodeRange(position);
  const options: DecorationOptions = {
    range: wikiLinkrange,
  };
  const decorations: DecorationAndType[] = [];

  // Highlight the alias part
  const linkText = document.getText(options.range);
  const aliasMatch = linkText.match(RE_ALIAS);
  if (
    aliasMatch &&
    aliasMatch.groups?.beforeAlias &&
    aliasMatch.groups?.alias
  ) {
    const { beforeAlias, alias } = aliasMatch.groups;
    decorations.push({
      type: DECORATION_TYPE.alias,
      decoration: {
        range: new Range(
          wikiLinkrange.start.line,
          wikiLinkrange.start.character + beforeAlias.length,
          wikiLinkrange.start.line,
          wikiLinkrange.start.character + beforeAlias.length + alias.length
        ),
      },
    });
  }

  // Highlight the wikilink itself
  decorations.push({ type, decoration: options });
  return decorations;
}

function decorateUserTag(userTag: UserTag) {
  const position = userTag.position as Position;
  if (_.isUndefined(position)) return [];

  const type = linkedNoteType({
    fname: userTag.fname,
  });

  return [
    { type, decoration: { range: VSCodeUtils.position2VSCodeRange(position) } },
  ];
}

function decorateReference(reference: NoteRefNoteV4, document: TextDocument) {
  const position = reference.position as Position;
  if (_.isUndefined(position)) return [];

  const type = linkedNoteType({
    fname: reference.data.link.from.fname,
    anchorStart: reference.data.link.data.anchorStart,
    anchorEnd: reference.data.link.data.anchorEnd,
    vaultName: reference.data.link.data.vaultName,
    document,
  });
  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };

  return [{ type, decoration }];
}
