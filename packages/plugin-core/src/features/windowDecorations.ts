import { FrontmatterContent } from "mdast";
import {
  BlockAnchor,
  DendronASTDest,
  DendronASTTypes,
  HashTag,
  MDUtilsV5,
  ProcMode,
  WikiLinkNoteV4,
  NoteRefNoteV4,
} from "@dendronhq/engine-server";
import { DecorationOptions, DecorationRangeBehavior, Range, TextEditor, TextEditorDecorationType, ThemeColor, window, TextDocument } from "vscode";
import visit from "unist-util-visit";
import _ from "lodash";
import { isNotUndefined, DefaultMap, randomColor, NoteUtils, Position, VaultUtils } from "@dendronhq/common-all";
import { DateTime } from "luxon";
import { getConfigValue, getWS } from "../workspace";
import { CodeConfigKeys, DateTimeFormat } from "../types";
import { VSCodeUtils } from "../utils";
import { containsNonDendronUri } from "../utils/md";

export function updateDecorations(activeEditor: TextEditor) {
  const text = activeEditor.document.getText();
  const proc = MDUtilsV5.procRemarkParse(
    {
      mode: ProcMode.NO_DATA,
      parseOnly: true,
    },
    { dest: DendronASTDest.MD_DENDRON }
  );
  const tree = proc.parse(text);
  const allDecorations = new DefaultMap<TextEditorDecorationType, DecorationOptions[]>(() => []);

  visit(tree, (node) => {
    switch (node.type) {
      case DendronASTTypes.FRONTMATTER: {
        const decorations = decorateTimestamps(node as FrontmatterContent);
        if (isNotUndefined(decorations)) {
          for (const decoration of decorations) {
            allDecorations.get(DECORATION_TYPE_TIMESTAMP).push(decoration);
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
      case DendronASTTypes.WIKI_LINK: {
        for (const [type, decoration] of decorateWikiLink(node as WikiLinkNoteV4, activeEditor.document)) {
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

  // Activate the decorations
  for (const [type, decorations] of allDecorations.entries()) {
    activeEditor.setDecorations(type, decorations);
  }
  // Clean out the now-unused tag decorations
  for (const [key, type] of DECORATION_TYPE_TAG.entries()) {
    if (!allDecorations.has(type)) {
      type.dispose();
      DECORATION_TYPE_TAG.delete(key);
    }
  }
  return allDecorations;
}

export const DECORATION_TYPE_TIMESTAMP = window.createTextEditorDecorationType({});

function decorateTimestamps(frontmatter: FrontmatterContent) {
  const { value: contents, position } = frontmatter;
  if (_.isUndefined(position)) return []; // should never happen
  const tsConfig = getConfigValue(
    CodeConfigKeys.DEFAULT_TIMESTAMP_DECORATION_FORMAT
  ) as DateTimeFormat;
  const formatOption = DateTime[tsConfig];

  const entries = contents.split("\n");
  const lineOffset =
    VSCodeUtils.point2VSCodePosition(position.start).line +
    1; /* `---` line of frontmatter */
  return entries
    .map((entry, line) => {
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
        return decoration;
      }
      return undefined;
    })
    .filter(isNotUndefined);
}

export const DECORATION_TYPE_BLOCK_ANCHOR = window.createTextEditorDecorationType({
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

export const DECORATION_TYPE_TAG = new DefaultMap<string, TextEditorDecorationType>((fname) => {
  return window.createTextEditorDecorationType({
    // sets opacity to about 37%
    backgroundColor: `${randomColor(fname)}60`,
    // Do not try to grow the decoration range when the user is typing,
    // because the color for a partial hashtag `#fo` is different from `#foo`.
    // We can't just reuse the first computed color and keep the decoration growing.
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  });
});

function decorateHashTag(hashtag: HashTag): [TextEditorDecorationType, DecorationOptions] | undefined {
  const position = hashtag.position;
  if (_.isUndefined(position)) return; // should never happen

  const type = DECORATION_TYPE_TAG.get(hashtag.fname);
  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
    
  };
  return [type, decoration];
}

/** Decoration for wikilinks that point to valid notes. */
export const DECORATION_TYPE_WIKILINK = window.createTextEditorDecorationType({
  color: new ThemeColor("editorLink.activeForeground"),
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

/** Decoration for wikilinks that do *not* point to valid notes (e.g. broken). */
export const DECORATION_TYPE_BROKEN_WIKILINK = window.createTextEditorDecorationType({
  color: new ThemeColor("editorWarning.foreground"),
  backgroundColor: new ThemeColor("editorWarning.background"),
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});


function doesLinkedNoteExist({fname, vaultName}: {fname: string, vaultName?: string}) {
  const {notes, vaults} = getWS().getEngine();
  const vault = vaultName ? VaultUtils.getVaultByName({vname: vaultName, vaults}) : undefined;
  // Vault specified, but can't find it.
  if (vaultName && !vault) return false;
  const found = NoteUtils.getNotesByFname({
    fname,
    vault,
    notes,
  });
  return found.length > 0;
}

/** Decoration for the alias part of wikilinks. */
export const DECORATION_TYPE_ALIAS = window.createTextEditorDecorationType({
  fontStyle: "italic",
});

const RE_ALIAS = /(?<beforeAlias>\[\[)(?<alias>[^|]+)\|/;

function decorateWikiLink(wikiLink: WikiLinkNoteV4, document: TextDocument) {
  const position = wikiLink.position as Position | undefined;
  if (_.isUndefined(position)) return []; // should never happen

  const foundNote = doesLinkedNoteExist({fname: wikiLink.value, vaultName: wikiLink.data.vaultName});
  const wikiLinkrange = VSCodeUtils.position2VSCodeRange(position);
  const options: DecorationOptions = {
    range: wikiLinkrange,
  };
  const decorations: [TextEditorDecorationType, DecorationOptions][] = [];
  
  // Highlight the alias part
  const linkText = document.getText(options.range);
  const aliasMatch = linkText.match(RE_ALIAS);
  if (aliasMatch && aliasMatch.groups?.beforeAlias && aliasMatch.groups?.alias) {
    const {beforeAlias, alias} = aliasMatch.groups;
    decorations.push([DECORATION_TYPE_ALIAS, { range: new Range(
      wikiLinkrange.start.line,
      wikiLinkrange.start.character + beforeAlias.length,
      wikiLinkrange.start.line,
      wikiLinkrange.start.character + beforeAlias.length + alias.length,
    )}]);
  }

  if (foundNote || containsNonDendronUri(wikiLink.value)) {
    decorations.push(
      [DECORATION_TYPE_WIKILINK, options]
    );
  } else {
    decorations.push(
      [DECORATION_TYPE_BROKEN_WIKILINK, options]
    );
  }
  return decorations;
}

function decorateReference(reference: NoteRefNoteV4): [TextEditorDecorationType, DecorationOptions] | undefined {
  const position = reference.position as Position;
  if (_.isUndefined(position)) return undefined;

  const foundNote = doesLinkedNoteExist({fname: reference.data.link.from.fname, vaultName: reference.data.link.data.vaultName});
  const options: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };

  if (foundNote) {
    return [DECORATION_TYPE_WIKILINK, options];
  } else {
    return [DECORATION_TYPE_BROKEN_WIKILINK, options]
  }
}