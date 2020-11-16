import vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { isInFencedCodeBlock } from "../external/memo/utils/utils";
import { isInCodeSpan, refPattern } from "../utils/md";
import { matchAll } from "../utils/strings";

// import { refPattern, matchAll, isInCodeSpan, isInFencedCodeBlock } from '../utils';

export default class DocumentLinkProvider
  implements vscode.DocumentLinkProvider {
  private readonly refPattern = new RegExp(refPattern, "g");

  public provideDocumentLinks(
    document: vscode.TextDocument
  ): vscode.DocumentLink[] {
    const results: vscode.DocumentLink[] = [];

    document
      .getText()
      .split(/\r?\n/g)
      .forEach((lineText, lineNum) => {
        for (const match of matchAll(this.refPattern, lineText)) {
          const reference = match[2];
          if (reference) {
            const offset = (match.index || 0) + 2;

            if (
              isInFencedCodeBlock(document, lineNum) ||
              isInCodeSpan(document, lineNum, offset)
            ) {
              continue;
            }

            const linkStart = new vscode.Position(lineNum, offset);
            const linkEnd = new vscode.Position(
              lineNum,
              offset + reference.length
            );

            const link = new vscode.DocumentLink(
              new vscode.Range(linkStart, linkEnd),
              vscode.Uri.parse(
                `command:${DENDRON_COMMANDS.GOTO_NOTE.key}?${encodeURIComponent(
                  JSON.stringify({ qs: reference, mode: "note" })
                )}`
              )
            );

            link.tooltip = "Follow link";

            results.push(link);
          }
        }
      });

    return results;
  }
}
