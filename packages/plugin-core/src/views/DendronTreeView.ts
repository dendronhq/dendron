import { DNodeUtils, Note, SchemaUtils } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import vscode, {
  ExtensionContext,
  ThemeIcon,
  TreeView,
  Uri,
  window,
} from "vscode";
import { DENDRON_COMMANDS, ICONS } from "../constants";
import { HistoryEvent, HistoryService } from "../services/HistoryService";
import { DendronWorkspace } from "../workspace";

function createTreeNote(note: Note) {
  const collapsibleState = _.isEmpty(note.children)
    ? vscode.TreeItemCollapsibleState.None
    : vscode.TreeItemCollapsibleState.Collapsed;
  const tn = new TreeNote({ note: note as Note, collapsibleState });
  if (note.stub) {
    tn.iconPath = new ThemeIcon(ICONS.STUB);
  } else if (note.schema && !SchemaUtils.isUnkown(note.schema)) {
    tn.iconPath = new ThemeIcon(ICONS.SCHEMA);
  }
  return tn;
}

export class TreeNote extends vscode.TreeItem {
  public note: Note;
  public uri: Uri;

  constructor({
    note,
    collapsibleState,
  }: {
    note: Note;
    collapsibleState: vscode.TreeItemCollapsibleState;
  }) {
    super(DNodeUtils.basename(note.fname, true), collapsibleState);
    this.note = note;
    this.uri = Uri.file(
      path.join(
        DendronWorkspace.instance().engine.props.root,
        this.note.fname + ".md"
      )
    );
    this.command = {
      command: DENDRON_COMMANDS.GOTO_NOTE.key,
      title: "",
      arguments: [{ qs: this.note.fname, mode: "note" }],
    };
  }

  get tooltip(): string {
    return this.note.title;
  }

  get children(): TreeNote[] {
    return this.note.children.map((note) => {
      return createTreeNote(note as Note);
    });
  }
}

export class EngineNoteProvider implements vscode.TreeDataProvider<TreeNote> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeNote | undefined | void
  > = new vscode.EventEmitter<TreeNote | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeNote | undefined | void> = this
    ._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNote): vscode.TreeItem {
    return element;
  }

  sort(notes: TreeNote[]) {
    return _.sortBy(notes, "label");
  }

  async getChildren(element?: TreeNote): Promise<TreeNote[]> {
    const engine = DendronWorkspace.instance().engine;
    if (!engine.notes["root"]) {
      vscode.window.showInformationMessage("No notes found");
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve(this.sort(element.children));
    } else {
      return this.sort(
        engine.notes["root"].children.map((note) => {
          return createTreeNote(note as Note);
        })
      );
    }
  }
}

export class DendronTreeView {
  static register(_context: ExtensionContext) {
    HistoryService.instance().subscribe(
      "extension",
      async (_event: HistoryEvent) => {
        if (_event.action === "initialized") {
          const ws = DendronWorkspace.instance();
          const treeDataProvider = new EngineNoteProvider();
          const treeView = window.createTreeView("dendronTreeView", {
            treeDataProvider,
          });
          const _class = new DendronTreeView(treeView, treeDataProvider);
          ws.dendronTreeView = _class;
        }
      }
    );
  }

  constructor(
    public treeView: TreeView<TreeNote>,
    public treeProvider: EngineNoteProvider
  ) {}
}
