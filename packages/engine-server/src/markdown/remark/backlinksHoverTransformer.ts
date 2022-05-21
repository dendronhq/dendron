import { HTML, Paragraph } from "mdast";
import Unified, { Transformer } from "unified";
import { Node, Position } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTTypes } from "../types";
import { RemarkUtils } from "./utils";

export function BacklinkHoverProcessor(
  this: Unified.Processor,
  _opts?: BacklinkOpts
): Transformer {
  function transformer(tree: Node, _file: VFile) {
    if (!_opts) {
      // addError(proc, DendronError.createPlainError());
      return;
    }

    const backlinkLineNumber = _opts.backLinkLineNumber;

    const lowerLineLimit = backlinkLineNumber - _opts.linesOfContext;
    const upperLineLimit = backlinkLineNumber + _opts.linesOfContext;

    let documentBodyStartLine = 0;
    let documentEndLine = 0;

    visit(tree, [DendronASTTypes.ROOT], (node, _index, _parent) => {
      if (RemarkUtils.isRoot(node)) {
        documentEndLine = node.position?.end.line ?? 0;

        // Count the last line of YAML as the 0 indexed start of the body of the document
        if (RemarkUtils.isYAML(node.children[0])) {
          documentBodyStartLine = node.children[0].position?.end.line ?? 0;
        }
      }
    });

    visit(tree, (node, index, parent) => {
      if (!node.position) {
        return;
      }

      // debugger;
      if (
        node.position.end.line < lowerLineLimit ||
        node.position.start.line > upperLineLimit
      ) {
        // debugger;
        if (parent) {
          parent.children.splice(index, 1);
          return index;
        }
      }

      if (node.position && node.position.start.line < lowerLineLimit) {
        if (RemarkUtils.isCode(node)) {
          const lines = node.value.split("\n");
          node.value = lines
            .slice(
              Math.max(0, lowerLineLimit - node.position.start.line - 2), // Adjust an offset to account for the code block ``` lines
              lines.length - 1
            )
            .join("\n");
        }
      } else if (node.position && node.position.end.line > upperLineLimit) {
        if (RemarkUtils.isCode(node)) {
          const lines = node.value.split("\n");
          node.value = lines
            .slice(
              0,
              upperLineLimit - node.position.end.line + 1 // Adjust an offset of 1 to account for the code block ``` line
            )
            .join("\n");
        }
      }

      if (RemarkUtils.isWikiLink(node)) {
        // if (_opts.backLinkLineNumber === node.position?.start.line) {
        if (
          _opts.backLinkLineNumber === node.position?.start.line &&
          node.position.start.column === _opts.location.start.column
        ) {
          (node as Node).type = DendronASTTypes.HTML;
          (
            node as unknown as HTML
          ).value = `<span style="color:#000;background-color:#FFFF00;">[[${node.value}]]</span>`;
        }
      } else if (RemarkUtils.isNoteRefV2(node)) {
        if (
          _opts.backLinkLineNumber === node.position?.start.line &&
          node.position.start.column === _opts.location.start.column
        ) {
          (node as Node).type = DendronASTTypes.HTML;
          (
            node as unknown as HTML
          ).value = `<span style="color:#000;background-color:#FFFF00;">![[${node.value}]]</span>`;
        }
      } else if (RemarkUtils.isText(node)) {
        if (_opts.backLinkLineNumber === node.position?.start.line) {
          const contents = node.value;
          const prefix = contents.substring(0, _opts.location.start.column - 1);

          const candidate = contents.substring(
            _opts.location.start.column - 1,
            _opts.location.end.column
          );
          const suffix = contents.substring(
            _opts.location.end.column - 1,
            contents.length - 1
          );

          (node as Node).type = DendronASTTypes.HTML;
          (
            node as unknown as HTML
          ).value = `${prefix}<span style="color:#000;background-color:#FFFF00;">${candidate}</span>${suffix}`;
        }
      }
      return undefined; // continue
    });

    visit(tree, [DendronASTTypes.ROOT], (node, _index, _parent) => {
      if (!RemarkUtils.isRoot(node)) {
        return;
      }

      const lowerBoundText =
        lowerLineLimit < documentBodyStartLine
          ? "Start of Note"
          : `Line ${lowerLineLimit}`;

      const lowerBoundParagraph: Paragraph = {
        type: DendronASTTypes.PARAGRAPH,
        children: [
          {
            type: DendronASTTypes.HTML,
            value: `--- <i>${lowerBoundText}<i/> ---`,
          },
        ],
      };

      node.children.unshift(lowerBoundParagraph);

      const upperBoundText =
        upperLineLimit >= documentEndLine
          ? "End of Note"
          : `Line ${upperLineLimit}`;

      const upperBoundParagraph: Paragraph = {
        type: DendronASTTypes.PARAGRAPH,
        children: [
          {
            type: DendronASTTypes.HTML,
            value: `--- <i>${upperBoundText}<i/> ---`,
          },
        ],
      };

      node.children.push(upperBoundParagraph);
    });
  }
  return transformer;
}

export type BacklinkOpts = {
  backLinkLineNumber: number; // TODO: Remove
  linesOfContext: number;
  location: Position;
};
