import {
  DefaultMap,
  isNotUndefined,
  NoteUtils,
  Position,
  TAGS_HIERARCHY,
  VaultUtils,
} from "@dendronhq/common-all";
import {
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
import { getConfigValue, getWSV2 } from "../workspace";
import {
  warnBadFrontmatterContents,
  warnMissingFrontmatter,
} from "./codeActionProvider";

const DECORATION_UPDATE_DELAY = 100;

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
  const allDecorations = new DefaultMap<
    TextEditorDecorationType,
    DecorationOptions[]
  >(() => []);
  let frontmatter: FrontmatterContent | undefined;

  visit(tree, (node) => {
    switch (node.type) {
      case DendronASTTypes.FRONTMATTER: {
        frontmatter = node as FrontmatterContent;
        const decorations = decorateFrontmatter(frontmatter);
        if (isNotUndefined(decorations)) {
          for (const [type, decoration] of decorations) {
            allDecorations.get(type).push(decoration);
          }
        }
        break;
      }
      case DendronASTTypes.BLOCK_ANCHOR: {
        const decoration = decorateBlockAnchor(node as BlockAnchor);
        if (isNotUndefined(decoration)) {
          allDecorations.get(DECORATION_TYPE_BLOCK_ANCHOR).push(decoration);
        }
        break;
      }
      case DendronASTTypes.HASHTAG: {
        const out = decorateHashTag(node as HashTag);
        if (isNotUndefined(out)) {
          const [type, decoration] = out;
          allDecorations.get(type).push(decoration);
        }
        break;
      }
      case DendronASTTypes.USERTAG: {
        const out = decorateUserTag(node as UserTag);
        if (isNotUndefined(out)) {
          const [type, decoration] = out;
          allDecorations.get(type).push(decoration);
        }
        break;
      }
      case DendronASTTypes.WIKI_LINK: {
        for (const [type, decoration] of decorateWikiLink(
          node as WikiLinkNoteV4,
          activeEditor.document
        )) {
          allDecorations.get(type).push(decoration);
        }
        break;
      }
      case DendronASTTypes.REF_LINK_V2:
      case DendronASTTypes.REF_LINK: {
        const out = decorateReference(node as NoteRefNoteV4);
        if (out) {
          const [type, decoration] = out;
          allDecorations.get(type).push(decoration);
        }
        break;
      }
      default:
      /* Nothing */
    }
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
    msg: `Displaying ${allWarnings.length} warnings and ${allDecorations.size} decorations`,
  });
  for (const [type, decorations] of allDecorations.entries()) {
    activeEditor.setDecorations(type, decorations);
  }

  // Clear out any old decorations left over from last pass
  const allTypes = [
    DECORATION_TYPE_TIMESTAMP,
    DECORATION_TYPE_BLOCK_ANCHOR,
    DECORATION_TYPE_WIKILINK,
    DECORATION_TYPE_BROKEN_WIKILINK,
    DECORATION_TYPE_ALIAS,
    DECORATION_TYPE_TAG,
  ];
  for (const type of allTypes) {
    if (!allDecorations.has(type)) {
      activeEditor.setDecorations(type, []);
    }
  }
  return { allDecorations, allWarnings };
}

export const DECORATION_TYPE_TIMESTAMP = window.createTextEditorDecorationType(
  {}
);

function decorateFrontmatter(frontmatter: FrontmatterContent) {
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
    .map((entry, line):
      | undefined
      | [TextEditorDecorationType, DecorationOptions] => {
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
        return [DECORATION_TYPE_TIMESTAMP, decoration];
      }
      return undefined;
    })
    .filter(isNotUndefined);

  // Decorate the frontmatter tags
  const tags = getFrontmatterTags(parseFrontmatter(contents));
  const fmTagDecorations = tags.map((tag) =>
    decorateTag({
      fname: `${TAGS_HIERARCHY}${tag.value}`,
      position: tag.position,
      lineOffset,
    })
  );
  return _.concat(timestampDecorations, fmTagDecorations);
}

export const DECORATION_TYPE_BLOCK_ANCHOR =
  window.createTextEditorDecorationType({
    opacity: "40%",
    rangeBehavior: DecorationRangeBehavior.ClosedOpen,
  });

function decorateBlockAnchor(blockAnchor: BlockAnchor) {
  const position = blockAnchor.position;
  if (_.isUndefined(position)) return; // should never happen

  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };
  return decoration;
}

const WIKILINK_DECORATION_OPTIONS = {
  color: new ThemeColor("editorLink.activeForeground"),
};

const BROKEN_WIKILINK_DECORATION_OPTIONS = {
  color: new ThemeColor("editorWarning.foreground"),
  backgroundColor: new ThemeColor("editorWarning.background"),
};

export const DECORATION_TYPE_TAG = window.createTextEditorDecorationType({
  ...WIKILINK_DECORATION_OPTIONS,
  // Do not try to grow the decoration range when the user is typing,
  // because the color for a partial hashtag `#fo` is different from `#foo`.
  // We can't just reuse the first computed color and keep the decoration growing.
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

export const DECORATION_TYPE_BROKEN_TAG = window.createTextEditorDecorationType(
  {
    ...BROKEN_WIKILINK_DECORATION_OPTIONS,
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }
);

function decorateHashTag(
  hashtag: HashTag
): [TextEditorDecorationType, DecorationOptions] | undefined {
  const position = hashtag.position;
  if (_.isUndefined(position)) return; // should never happen

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
}): [TextEditorDecorationType, DecorationOptions] {
  const { color: backgroundColor } = NoteUtils.color({
    fname,
    notes: getWSV2().engine.notes,
  });

  const type = doesLinkedNoteExist({ fname })
    ? DECORATION_TYPE_TAG
    : DECORATION_TYPE_BROKEN_TAG;
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

  return [type, decoration];
}

/** Decoration for wikilinks that point to valid notes. */
export const DECORATION_TYPE_WIKILINK = window.createTextEditorDecorationType({
  ...WIKILINK_DECORATION_OPTIONS,
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

/** Decoration for wikilinks that do *not* point to valid notes (e.g. broken). */
export const DECORATION_TYPE_BROKEN_WIKILINK =
  window.createTextEditorDecorationType({
    ...BROKEN_WIKILINK_DECORATION_OPTIONS,
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  });

function doesLinkedNoteExist({
  fname,
  vaultName,
}: {
  fname: string;
  vaultName?: string;
}) {
  const { notes, vaults } = getWSV2().engine;
  const vault = vaultName
    ? VaultUtils.getVaultByName({ vname: vaultName, vaults })
    : undefined;
  // Vault specified, but can't find it.
  if (vaultName && !vault) return false;
  let exists: boolean;
  try {
    exists =
      NoteUtils.getNotesByFname({
        fname,
        vault,
        notes,
      }).length > 0;
  } catch (err) {
    Logger.info({ ctx: "doesLinkedNoteExist", err });
    exists = false;
  }
  return exists;
}

/** Decoration for the alias part of wikilinks. */
export const DECORATION_TYPE_ALIAS = window.createTextEditorDecorationType({
  fontStyle: "italic",
});

const RE_ALIAS = /(?<beforeAlias>\[\[)(?<alias>[^|]+)\|/;

function decorateWikiLink(wikiLink: WikiLinkNoteV4, document: TextDocument) {
  const position = wikiLink.position as Position | undefined;
  if (_.isUndefined(position)) return []; // should never happen

  const foundNote = doesLinkedNoteExist({
    fname: wikiLink.value,
    vaultName: wikiLink.data.vaultName,
  });
  const wikiLinkrange = VSCodeUtils.position2VSCodeRange(position);
  const options: DecorationOptions = {
    range: wikiLinkrange,
  };
  const decorations: [TextEditorDecorationType, DecorationOptions][] = [];

  // Highlight the alias part
  const linkText = document.getText(options.range);
  const aliasMatch = linkText.match(RE_ALIAS);
  if (
    aliasMatch &&
    aliasMatch.groups?.beforeAlias &&
    aliasMatch.groups?.alias
  ) {
    const { beforeAlias, alias } = aliasMatch.groups;
    decorations.push([
      DECORATION_TYPE_ALIAS,
      {
        range: new Range(
          wikiLinkrange.start.line,
          wikiLinkrange.start.character + beforeAlias.length,
          wikiLinkrange.start.line,
          wikiLinkrange.start.character + beforeAlias.length + alias.length
        ),
      },
    ]);
  }

  if (foundNote || containsNonDendronUri(wikiLink.value)) {
    decorations.push([DECORATION_TYPE_WIKILINK, options]);
  } else {
    decorations.push([DECORATION_TYPE_BROKEN_WIKILINK, options]);
  }
  return decorations;
}

function decorateUserTag(
  userTag: UserTag
): [TextEditorDecorationType, DecorationOptions] | undefined {
  const position = userTag.position as Position;
  if (_.isUndefined(position)) return undefined;

  const userNoteFound = doesLinkedNoteExist({
    fname: userTag.fname,
  });
  const type = userNoteFound
    ? DECORATION_TYPE_WIKILINK
    : DECORATION_TYPE_BROKEN_WIKILINK;

  return [type, { range: VSCodeUtils.position2VSCodeRange(position) }];
}

function decorateReference(
  reference: NoteRefNoteV4
): [TextEditorDecorationType, DecorationOptions] | undefined {
  const position = reference.position as Position;
  if (_.isUndefined(position)) return undefined;

  const foundNote = doesLinkedNoteExist({
    fname: reference.data.link.from.fname,
    vaultName: reference.data.link.data.vaultName,
  });
  const options: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };

  if (foundNote) {
    return [DECORATION_TYPE_WIKILINK, options];
  } else {
    return [DECORATION_TYPE_BROKEN_WIKILINK, options];
  }
}
