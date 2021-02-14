import { NoteUtilsV2 } from "@dendronhq/common-all";
import vscode from "vscode";

export default class FrontmatterFoldingRangeProvider
  implements vscode.FoldingRangeProvider {
  public async provideFoldingRanges(
    document: vscode.TextDocument
  ): Promise<vscode.FoldingRange[]> {
    const content = document.getText();
    const fmMatch = content.match(NoteUtilsV2.RE_FM);
    if (!fmMatch) {
      return [];
    }
    const fmContent = fmMatch[0];
    // we know fmContent cannot be null since fmMatch exists.
    const fmContentLength = fmContent.match(/^/gm)!.length;
    return [new vscode.FoldingRange(0, fmContentLength)];
  }
}
