import { DendronASTDest, MDUtilsV5, ProcMode } from "@dendronhq/engine-server";
import vscode, { FoldingRangeKind } from "vscode";
import visit from "unist-util-visit";
import _ from "lodash";
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
    const proc = MDUtilsV5.procRemarkParse(
      {
        mode: ProcMode.NO_DATA,
        parseOnly: true,
      },
      { dest: DendronASTDest.MD_DENDRON }
    );
    const parsed = proc.parse(document.getText());
    let range: vscode.FoldingRange | undefined;
    visit(parsed, ["yaml"], (node) => {
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
