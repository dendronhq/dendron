import vscode from "vscode";
import path from "path";
import {
  containsMarkdownExt,
  findReferences,
  FoundRefT,
  sortPaths,
} from "../utils/md";
import _ from "lodash";
// import groupBy from 'lodash.groupby';

// import {
//   containsMarkdownExt,
//   findReferences,
//   getWorkspaceFolder,
//   trimSlashes,
//   sortPaths,
//   getMemoConfigProperty,
// } from '../utils';
// import { FoundRefT } from '../types';

class Backlink extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public refs: FoundRefT[] | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}

export default class BacklinksTreeDataProvider
  implements vscode.TreeDataProvider<Backlink> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Backlink | undefined
  > = new vscode.EventEmitter<Backlink | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Backlink | undefined> = this
    ._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: Backlink) {
    return element;
  }

  public async getChildren(element?: Backlink) {
    if (!element) {
      const fsPath = vscode.window.activeTextEditor?.document.uri.fsPath;

      if (!fsPath || (fsPath && !containsMarkdownExt(fsPath))) {
        return [];
      }

      const refFromFilename = path.parse(fsPath).name;

      const referencesByPath = _.groupBy(
        await findReferences(refFromFilename, [fsPath]),
        ({ location }) => location.uri.fsPath
      );

      const pathsSorted = sortPaths(Object.keys(referencesByPath), {
        shallowFirst: true,
      });

      if (!pathsSorted.length) {
        return [];
      }

      const collapsibleState = true //getMemoConfigProperty('backlinksPanel.collapseParentItems', false)
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.Expanded;

      return pathsSorted.map((pathParam) => {
        const backlink = new Backlink(
          path.basename(pathParam),
          referencesByPath[pathParam],
          collapsibleState
        );
        backlink.description = `(${
          referencesByPath[pathParam].length
        }) - (${path.basename(pathParam)})`;
        backlink.tooltip = pathParam;
        backlink.command = {
          command: "vscode.open",
          arguments: [
            vscode.Uri.file(pathParam),
            { selection: new vscode.Range(0, 0, 0, 0) },
          ],
          title: "Open File",
        };
        return backlink;
      });
    }

    const refs = element?.refs;

    if (!refs) {
      return [];
    }

    return refs.map((ref) => {
      const backlink = new Backlink(
        `${ref.location.range.start.line + 1}:${
          ref.location.range.start.character
        }`,
        undefined,
        vscode.TreeItemCollapsibleState.None
      );

      backlink.description = ref.matchText;
      backlink.tooltip = ref.matchText;
      backlink.command = {
        command: "vscode.open",
        arguments: [ref.location.uri, { selection: ref.location.range }],
        title: "Open File",
      };

      return backlink;
    });
  }
}
