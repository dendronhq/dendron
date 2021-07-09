import { FrontmatterContent } from "mdast";
import {
  BlockAnchor,
  DendronASTDest,
  DendronASTTypes,
  MDUtilsV5,
  ProcMode,
} from "@dendronhq/engine-server";
import { DecorationOptions, Range, TextEditor, window } from "vscode";
import visit from "unist-util-visit";
import _ from "lodash";
import { isNotUndefined, NoteUtils } from "@dendronhq/common-all";
import { DateTime } from "luxon";
import { getConfigValue } from "../workspace";
import { CodeConfigKeys, DateTimeFormat } from "../types";
import { VSCodeUtils } from "../utils";

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
  const blockAnchorDecorations: DecorationOptions[] = [];
  let timestampDecorations: DecorationOptions[] = [];

  visit(tree, (node) => {
    switch (node.type) {
      case DendronASTTypes.FRONTMATTER: {
        const decoration = decorateTimestamps(node as FrontmatterContent);
        if (isNotUndefined(decoration)) timestampDecorations = decoration;
        break;
      }
      case DendronASTTypes.BLOCK_ANCHOR: {
        const decoration = decorateBlockAnchor(node as BlockAnchor);
        if (isNotUndefined(decoration)) blockAnchorDecorations.push(decoration);
        break;
      }
    }
  });

  activeEditor.setDecorations(
    DECORATION_TYPE_BLOCK_ANCHOR,
    blockAnchorDecorations
  );
  activeEditor.setDecorations(DECORATION_TYPE_TIMESTAMP, timestampDecorations);
  return { blockAnchorDecorations, timestampDecorations };
}

const DECORATION_TYPE_TIMESTAMP = window.createTextEditorDecorationType({});

function decorateTimestamps(frontmatter: FrontmatterContent) {
  const { value: contents, position } = frontmatter;
  if (_.isUndefined(position)) return; // should never happen
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

const DECORATION_TYPE_BLOCK_ANCHOR = window.createTextEditorDecorationType({
  opacity: "40%",
});

function decorateBlockAnchor(blockAnchor: BlockAnchor) {
  const position = blockAnchor.position;
  if (_.isUndefined(position)) return; // should never happen

  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };
  return decoration;
}
