import { HTML, Paragraph } from "mdast";
import Unified, { Transformer } from "unified";
import { Node, Position } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTTypes } from "../types";
import { RemarkUtils } from "./utils";

/**
 * Options for the backlinks hover transformer. If using
 * ProcFlavor.BACKLINKS_PANEL_HOVER, then this must be set.
 */
export type BacklinkOpts = {
  /**
   * How many lines before and after the backlink to show in the hover
   */
  linesOfContext: number;

  /**
   * The location of the backlink text
   */
  location: Position;
};

/**
 * Unified processor for rendering text in the backlinks hover control. This
 * processor returns a transformer that does the following:
 * 1. Highlights the backlink text
 * 2. Changes the backlink node away from a wikilink/noteref to prevent the
 *    backlink text from being altered
 * 3. Adds contextual " --- line # ---" information
 * 4. Removes all elements that beyond the contextual lines limit of the
 *    backlink
 * @param this
 * @param _opts
 * @returns
 */
export function BacklinkHoverProcessor(
  this: Unified.Processor,
  _opts?: BacklinkOpts
): Transformer {
  function transformer(tree: Node, _file: VFile) {
    if (!_opts) {
      // addError(proc, DendronError.createPlainError());
      return;
    }

    const backlinkLineNumber = _opts.location.start.line;

    const lowerLineLimit = backlinkLineNumber - _opts.linesOfContext;
    const upperLineLimit = backlinkLineNumber + _opts.linesOfContext;

    /**
     * The last line of the YAML frontmatter counts as line 0.
     */
    let documentBodyStartLine = 0;
    let documentEndLine = 0;

    // In the first visit, set the beginning and end markers of the document.
    visit(tree, [DendronASTTypes.ROOT], (node, _index, _parent) => {
      if (RemarkUtils.isRoot(node)) {
        documentEndLine = node.position?.end.line ?? 0;

        // Count the last line of YAML as the 0 indexed start of the body of the document
        if (RemarkUtils.isYAML(node.children[0])) {
          documentBodyStartLine = node.children[0].position?.end.line ?? 0;
        }
      }
    });

    // In the second visit, modify the wikilink/ref/candidate that is the
    // backlink to highlight it and to change its node type so that it appears
    // in its text form to the user (we don't want to convert a noteref backlink
    // into its reffed contents for example)
    visit(tree, (node, index, parent) => {
      if (!node.position) {
        return;
      }

      if (
        node.position.end.line < lowerLineLimit ||
        node.position.start.line > upperLineLimit
      ) {
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
        if (
          backlinkLineNumber === node.position?.start.line &&
          node.position.start.column === _opts.location.start.column
        ) {
          (node as Node).type = DendronASTTypes.HTML;
          (
            node as unknown as HTML
          ).value = `<span style="color:#000;background-color:#FFFF00;">[[${node.value}]]</span>`;
        }
      } else if (RemarkUtils.isNoteRefV2(node)) {
        if (
          backlinkLineNumber === node.position?.start.line &&
          node.position.start.column === _opts.location.start.column
        ) {
          (node as Node).type = DendronASTTypes.HTML;
          (
            node as unknown as HTML
          ).value = `<span style="color:#000;background-color:#FFFF00;">![[${node.value}]]</span>`;
        }
      } else if (RemarkUtils.isText(node)) {
        if (
          backlinkLineNumber === node.position?.start.line &&
          node.position.end.column > _opts.location.start.column &&
          node.position.start.column < _opts.location.end.column
        ) {
          const contents = node.value;
          const prefix = contents.substring(0, _opts.location.start.column - 1);

          const candidate = contents.substring(
            _opts.location.start.column - 1,
            _opts.location.end.column - 1
          );
          const suffix = contents.substring(
            _opts.location.end.column - 1,
            contents.length
          );

          (node as Node).type = DendronASTTypes.HTML;
          (
            node as unknown as HTML
          ).value = `${prefix}<span style="color:#000;background-color:#FFFF00;">${candidate}</span>${suffix}`;

          return index;
        }
      }
      return;
    });

    // In the third visit, add the contextual line marker information
    visit(tree, [DendronASTTypes.ROOT], (node, _index, _parent) => {
      if (!RemarkUtils.isRoot(node) || !node.position) {
        return;
      }

      const lowerBoundText =
        lowerLineLimit <= documentBodyStartLine
          ? "Start of Note"
          : `Line ${lowerLineLimit - 1}`;

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
          : `Line ${upperLineLimit + 1}`;

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
