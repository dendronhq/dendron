import { FoundRefT } from "../utils/md";
import vscode from "vscode";

export type BacklinkFoundRef = FoundRefT & {
  parentBacklink: Backlink | undefined;
};

export class Backlink extends vscode.TreeItem {
  public refs: BacklinkFoundRef[] | undefined;
  public parentBacklink: Backlink | undefined;

  constructor(
    public readonly label: string,
    refs: FoundRefT[] | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    if (refs) {
      this.refs = refs.map((r) => ({ ...r, parentBacklink: this }));
    } else {
      this.refs = undefined;
    }
  }
}
