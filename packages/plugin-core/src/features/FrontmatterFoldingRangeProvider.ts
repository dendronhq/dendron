import { NoteUtils } from "@dendronhq/common-all";
import vscode from "vscode";

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
    const content = document.getText();
    const fmMatch = content.match(NoteUtils.RE_FM);
    if (!fmMatch) {
      return [];
    }
    const fmContent = fmMatch[0];
    // we know fmContent cannot be null since fmMatch exists.
    const fmContentLength = fmContent.match(/^/gm)!.length;
    // there is fmContentLength lines, so the index of the last line is fmContentLength - 1
    return [new vscode.FoldingRange(0, fmContentLength - 1)];
  }
}
