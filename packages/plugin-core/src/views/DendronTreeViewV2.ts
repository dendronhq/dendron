import {
  DendronError,
  DNodeUtils,
  NotePropsDictV2,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
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
import { GotoNoteCommandOpts } from "../commands/GotoNote";
import { DENDRON_COMMANDS, ICONS } from "../constants";
import { Logger } from "../logger";
import { DendronWorkspace, getEngine, getWS } from "../workspace";
import { HistoryEvent, HistoryService } from "@dendronhq/engine-server";
import { vault2Path } from "@dendronhq/common-server";

function createTreeNote(note: NoteProps) {
  const collapsibleState = _.isEmpty(note.children)
    ? vscode.TreeItemCollapsibleState.None
    : vscode.TreeItemCollapsibleState.Collapsed;
  const tn = new TreeNote({
    note,
    collapsibleState,
  });
  if (note.stub) {
    tn.iconPath = new ThemeIcon(ICONS.STUB);
  } else if (note.schema) {
    tn.iconPath = new ThemeIcon(ICONS.SCHEMA);
  }
  return tn;
}

export class TreeNote extends vscode.TreeItem {
  public id: string;
  public note: NoteProps;
  public uri: Uri;
  public children: string[] = [];
  public L: typeof Logger;

  constructor({
    note,
    collapsibleState,
  }: {
    note: NoteProps;
    collapsibleState: vscode.TreeItemCollapsibleState;
  }) {
    super(DNodeUtils.basename(note.fname, true), collapsibleState);
    this.note = note;
    this.id = this.note.id;
    this.tooltip = this.note.title;
    const vpath = vault2Path({
      vault: this.note.vault,
      wsRoot: DendronWorkspace.wsRoot(),
    });
    this.uri = Uri.file(path.join(vpath, this.note.fname + ".md"));
    if (DNodeUtils.isRoot(note)) {
      this.label = `root (${VaultUtils.getName(note.vault)})`;
    }
    this.command = {
      command: DENDRON_COMMANDS.GOTO_NOTE.key,
      title: "",
      arguments: [
        {
          qs: this.note.fname,
          mode: "note",
          vault: this.note.vault,
        } as GotoNoteCommandOpts,
      ],
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
    const client = DendronWorkspace.instance().getEngine();
    const roots = _.filter(_.values(client.notes), DNodeUtils.isRoot);
    if (!roots) {
      vscode.window.showInformationMessage("No notes found");
      return Promise.resolve([]);
    }
    if (id) {
      return Promise.resolve(this.tree[id].children);
    } else {
      Logger.info({ ctx, msg: "reconstructing tree" });
      return Promise.all(
        roots.flatMap(
          async (root) => (await this.parseTree(root, client.notes)).id
        )
      );
    }
  }

  async getParent(id: string) {
    const client = DendronWorkspace.instance().getEngine();
    const maybeParent =
      client.notes[(this.tree[id] as TreeNote).note.parent || ""];
    return maybeParent ? maybeParent.id : null;
  }

  async parseTree(note: NoteProps, ndict: NotePropsDictV2): Promise<TreeNote> {
    const ctx = "parseTree";
    const tn = createTreeNote(note);
    this.tree[note.id] = tn;
    tn.children = await Promise.all(
      note.children.map(async (c) => {
        const childNote = ndict[c];
        if (!childNote) {
          const payload = {
            msg: `no childNote found: ${c}, current note: ${note.id}`,
            fullDump: _.values(ndict).map((n) => NoteUtils.toLogObj(n)),
          };
          const err = new DendronError({ payload });
          Logger.error({ ctx, err });
          throw err;
        }
        return (await this.parseTree(childNote, ndict)).id;
      })
    );
    // tn.children = this.sort(children).map((c) => c.id);
    // Logger.debug({ ctx, msg: "exit" });
    return tn;
  }
}

export class DendronTreeViewV2 {
  public pause?: boolean;

  static register(_context: ExtensionContext) {
    HistoryService.instance().subscribe(
      "extension",
      async (_event: HistoryEvent) => {
        if (_event.action === "initialized") {
          const ws = DendronWorkspace.instance();
          const treeDataProvider = new EngineNoteProvider();
          await treeDataProvider.getChildren();
          const treeView = window.createTreeView("dendronTreeView", {
            treeDataProvider,
            showCollapseAll: true,
          });
          const _class = new DendronTreeViewV2(treeView, treeDataProvider);
          ws.dendronTreeView = _class;
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
    const wsRoot = DendronWorkspace.wsRoot();
    const ws = getWS();
    if (!ws.workspaceService?.isPathInWorkspace(uri.fsPath)) {
      return;
    }
    if (basename.endsWith(".md")) {
      const vault = VaultUtils.getVaultByNotePathV4({
        fsPath: uri.fsPath,
        wsRoot,
        vaults: DendronWorkspace.instance().vaultsv4,
      });
      const fname = NoteUtils.uri2Fname(uri);
      const note = NoteUtils.getNoteByFnameV5({
        fname,
        vault,
        notes: getEngine().notes,
        wsRoot,
      }) as NoteProps;
      if (note && !this.pause) {
        this.treeView.reveal(note.id);
      }
    }
  }
}
