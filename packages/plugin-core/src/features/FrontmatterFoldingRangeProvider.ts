import { RemarkUtils } from "@dendronhq/unified";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import vscode, { FoldingRangeKind } from "vscode";
import { VSCodeUtils } from "../vsCodeUtils";

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
    try {
      const nodePosition = RemarkUtils.getNodePositionPastFrontmatter(
        document.getText()
      );
      const range =
        nodePosition !== undefined
          ? new vscode.FoldingRange(
              VSCodeUtils.point2VSCodePosition(nodePosition.start).line,
              VSCodeUtils.point2VSCodePosition(nodePosition.end).line,
              FoldingRangeKind.Region
            )
          : undefined;
      if (_.isUndefined(range)) return [];
      return [range];
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}
