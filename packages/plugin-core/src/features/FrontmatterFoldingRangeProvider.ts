import { DendronASTDest, MDUtilsV5, UnistNode } from "@dendronhq/engine-server";
import _ from "lodash";
// @ts-ignore
import visit from "unist-util-visit";
import vscode, { FoldingRangeKind } from "vscode";
import { VSCodeUtils } from "../utils";

export default class FrontmatterFoldingRangeProvider
  implements vscode.FoldingRangeProvider
{
  /**
   * Returns the folding range of the frontmatter section of a markdown note.
   * @param document The document we want to find the folding range.
   * @returns The frontmatter folding range of given Dendron note as an array.
   */
  public async provideFoldingRanges(
    document: vscode.TextDocument
  ): Promise<vscode.FoldingRange[]> {
    const proc = MDUtilsV5.procRemarkParseNoData(
      {},
      { dest: DendronASTDest.MD_DENDRON }
    );
    const parsed = proc.parse(document.getText());
    let range: vscode.FoldingRange | undefined;
    // @ts-ignore
    visit(parsed, ["yaml"], (node: UnistNode) => {
      if (_.isUndefined(node.position)) return false; // Should never happen
      range = new vscode.FoldingRange(
        VSCodeUtils.point2VSCodePosition(node.position.start).line,
        VSCodeUtils.point2VSCodePosition(node.position.end).line,
        FoldingRangeKind.Region
      );

      // Found the frontmatter already, stop traversing
      return false;
    });

    if (_.isUndefined(range)) return [];
    return [range];
  }
}
