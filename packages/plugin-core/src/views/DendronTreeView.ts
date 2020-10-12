import { DNodeUtils, Note, SchemaUtils } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import vscode, {
  ExtensionContext,
  TextEditor,
  ThemeIcon,
  TreeView,
  Uri,
  window,
} from "vscode";
import { DENDRON_COMMANDS, ICONS } from "../constants";
import { Logger } from "../logger";
import { HistoryEvent, HistoryService } from "../services/HistoryService";
import { DendronWorkspace } from "../workspace";

function createTreeNote(note: Note) {
  const collapsibleState = _.isEmpty(note.children)
    ? vscode.TreeItemCollapsibleState.None
    : vscode.TreeItemCollapsibleState.Collapsed;
  const tn = new TreeNote({
    note: note as Note,
    collapsibleState,
  });
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
  public children: string[] = [];
  public L: typeof Logger;

  constructor({
    note,
    collapsibleState,
  }: {
    note: Note;
    collapsibleState: vscode.TreeItemCollapsibleState;
  }) {
    super(DNodeUtils.basename(note.fname, true), collapsibleState);
    this.note = note;
    this.id = this.note.id;
    this.tooltip = this.note.title;
    const mainVault = (DendronWorkspace.workspaceFolders() as vscode.WorkspaceFolder[])[0];
    this.uri = Uri.file(
      path.join(mainVault.uri.fsPath, this.note.fname + ".md")
    );
    this.command = {
      command: DENDRON_COMMANDS.GOTO_NOTE.key,
      title: "",
      arguments: [{ qs: this.note.fname, mode: "note" }],
    };
    this.L = DendronWorkspace.instance().L;
  }
}

export class EngineNoteProvider implements vscode.TreeDataProvider<string> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    string | undefined | void
  > = new vscode.EventEmitter<string | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<string | undefined | void> = this
    ._onDidChangeTreeData.event;
  public tree: { [key: string]: TreeNote } = {};
  public active: string | undefined;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  sort(notes: TreeNote[]): TreeNote[] {
    return _.sortBy(notes, "label");
  }

  getTreeItem(id: string): vscode.TreeItem {
    return this.tree[id];
  }

  getChildren(id?: string): Thenable<string[]> {
    const ctx = "TreeView:getChildren";
    Logger.debug({ ctx, id });
    if (DendronWorkspace.lsp()) {
      // TODO
      return Promise.resolve([]);
    } else {
      const engine = DendronWorkspace.instance().engine;
      if (!engine.notes["root"]) {
        vscode.window.showInformationMessage("No notes found");
        return Promise.resolve([]);
      }

      if (id) {
        return Promise.resolve(this.tree[id].children);
      } else {
        Logger.info({ ctx, msg: "reconstructing tree" });
        const root = engine.notes["root"];
        return Promise.resolve(this.parseTree(root).children);
      }
    }
  }

  async getParent(id: string) {
    const parentId = this.tree[id].note.parent?.id;
    return parentId ? parentId : null;
  }

  parseTree(note: Note): TreeNote {
    const tn = createTreeNote(note);
    this.tree[note.id] = tn;
    let children = note.children.map((c) => {
      return this.parseTree(c as Note);
    });
    // @ts-ignore
    tn.children = this.sort(children).map((c) => c.id);
    return tn;
  }
}

export class DendronTreeView {
  static register(_context: ExtensionContext) {
    HistoryService.instance().subscribe(
      "extension",
      async (_event: HistoryEvent) => {
        if (_event.action === "initialized") {
          const ctx = "DendronTreeView:register";
          Logger.info({ ctx, msg: "enter" });
          const ws = DendronWorkspace.instance();
          const treeDataProvider = new EngineNoteProvider();
          await treeDataProvider.getChildren();
          Logger.info({ ctx, msg: "post-dataProvider-init" });
          const treeView = window.createTreeView("dendronTreeView", {
            treeDataProvider,
            showCollapseAll: true,
          });
          Logger.info({ ctx, msg: "post-treeView-init" });
          const _class = new DendronTreeView(treeView, treeDataProvider);
          ws.dendronTreeView = _class;
          Logger.info({ ctx, msg: "exit" });
        }
      }
    );
  }

  constructor(
    public treeView: TreeView<string>,
    public treeProvider: EngineNoteProvider
  ) {
    DendronWorkspace.instance().addDisposable(
      window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this)
    );
  }

  async onOpenTextDocument(editor: TextEditor | undefined) {
    if (_.isUndefined(editor)) {
      return;
    }
    if (!this.treeView.visible) {
      return;
    }
    const uri = editor.document.uri;
    const basename = path.basename(uri.fsPath);
    if (basename.endsWith(".md")) {
      const fname = DNodeUtils.uri2Fname(uri);
      const note = DNodeUtils.getNoteByFname(
        fname,
        DendronWorkspace.instance().engine
      );
      if (note) {
        this.treeView.reveal(note.id);
      }
    }
  }
}
