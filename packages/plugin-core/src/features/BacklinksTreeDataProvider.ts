import vscode from "vscode";
import path from "path";
import {
  containsMarkdownExt,
  findReferences,
  FoundRefT,
  sortPaths,
} from "../utils/md";
import _ from "lodash";
import { ICONS } from "../constants";

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
  implements vscode.TreeDataProvider<Backlink>
{
  private _onDidChangeTreeData: vscode.EventEmitter<Backlink | undefined> =
    new vscode.EventEmitter<Backlink | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Backlink | undefined> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: Backlink) {
    return element;
  }

  public async getChildren(element?: Backlink) {
    const fsPath = vscode.window.activeTextEditor?.document.uri.fsPath;

    if (!element) {
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

      const collapsibleState = true
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
    } else if (element.label === "links" || element.label === "unreferenced") {
      const refs = element?.refs;
      if (!refs) {
        return [];
      }
      return refs.map((ref) => {
        const lineNum = ref.location.range.start.line;
        const backlink = new Backlink(
          ref.matchText,
          undefined,
          vscode.TreeItemCollapsibleState.None
        );
        backlink.description = `on line ${lineNum}`;
        backlink.tooltip = ref.matchText;
        backlink.command = {
          command: "vscode.open",
          arguments: [ref.location.uri, { selection: ref.location.range }],
          title: "Open File",
        };
        if (ref.isUnref) {
          backlink.command = {
            command: "dendron.convertLink",
            title: "Convert Link",
            arguments: [
              { location: ref.location, text: path.parse(fsPath!).name },
            ],
          };
        }
        return backlink;
      });
    }

    const refs = element?.refs;
    if (!refs) {
      return [];
    }

    const [wikilinks, unreflinks] = _.partition(refs, (ref) => {
      return !ref.isUnref;
    });

    const out: Backlink[] = [];
    const backlinkTreeItem = new Backlink(
      "links",
      wikilinks,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    backlinkTreeItem.iconPath = new vscode.ThemeIcon(ICONS.WIKILINK);
    backlinkTreeItem.description = `${wikilinks.length} link(s).`;
    out.push(backlinkTreeItem);

    const unrefCount = unreflinks.length;
    if (unrefCount > 0) {
      const unrefTreeItem = new Backlink(
        "unreferenced",
        unreflinks,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      unrefTreeItem.iconPath = new vscode.ThemeIcon(ICONS.UNREFLINK);
      unrefTreeItem.description = `${unreflinks.length} unreferenced items.`;
      out.push(unrefTreeItem);
    }
    return out;
  }
}
