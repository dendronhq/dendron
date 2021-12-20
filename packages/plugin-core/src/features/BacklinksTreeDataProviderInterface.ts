import { Backlink } from "./Backlink";
import vscode, { ProviderResult } from "vscode";

export interface IBacklinksTreeDataProvider
  extends vscode.TreeDataProvider<Backlink> {
  refresh(): void;

  getTreeItem(element: Backlink): Backlink;

  getParent(element: Backlink): ProviderResult<Backlink>;

  getChildren(element?: Backlink): Promise<Backlink[] | undefined>;
}
