import {
  DendronError,
  DendronTreeViewKey,
  DNodeUtils,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryEvent, HistoryService } from "@dendronhq/engine-server";
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
import { getDWorkspace, getExtension } from "../workspace";
import {
  IDendronTreeView,
  IEngineNoteProvider,
  ITreeNote,
} from "./DendronTreeViewInterface";

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

export class TreeNote extends vscode.TreeItem implements ITreeNote {
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
      wsRoot: getDWorkspace().wsRoot,
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
    this.L = Logger;
  }
}

export class EngineNoteProvider
  implements vscode.TreeDataProvider<string>, IEngineNoteProvider
{
  private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | void> =
    new vscode.EventEmitter<string | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<string | undefined | void> =
    this._onDidChangeTreeData.event;
  public tree: { [key: string]: TreeNote } = {};
  public active: string | undefined;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  sort(notes: TreeNote[]): TreeNote[] {
    return _.sortBy(notes, "label");
  }

  sortChildren(children: string[], noteDict: NotePropsDict) {
    return _.sortBy(children, (id) => noteDict[id].title);
  }

  getTreeItem(id: string): vscode.TreeItem {
    return this.tree[id];
  }

  async getChildren(id?: string) {
    const ctx = "TreeView:getChildren";
    Logger.debug({ ctx, id });
    const { engine } = getDWorkspace();
    const roots = _.filter(_.values(engine.notes), DNodeUtils.isRoot);
    if (!roots) {
      vscode.window.showInformationMessage("No notes found");
      return Promise.resolve([]);
    }
    if (id) {
      const children = this.tree[id].children;
      this.sortChildren(children, engine.notes);
      return Promise.resolve(children);
    } else {
      Logger.info({ ctx, msg: "reconstructing tree: enter" });
      const out = await Promise.all(
        roots.flatMap(
          async (root) => (await this.parseTree(root, engine.notes)).id
        )
      );
      Logger.info({ ctx, msg: "reconstructing tree: exit" });
      return out;
    }
  }

  async getParent(id: string) {
    const { engine: client } = getDWorkspace();
    const maybeParent =
      client.notes[(this.tree[id] as TreeNote).note.parent || ""];
    return maybeParent ? maybeParent.id : null;
  }

  async parseTree(note: NoteProps, ndict: NotePropsDict): Promise<TreeNote> {
    const ctx = "parseTree";
    const tn = createTreeNote(note);
    this.tree[note.id] = tn;
    const children = note.children;
    this.sortChildren(children, ndict);
    tn.children = await Promise.all(
      children.map(async (c) => {
        const childNote = ndict[c];
        if (!childNote) {
          const payload = {
            msg: `no childNote found: ${c}, current note: ${note.id}`,
            fullDump: _.values(ndict).map((n) => NoteUtils.toLogObj(n)),
          };
          const err = new DendronError({
            message: "error updating tree view",
            payload,
          });
          Logger.error({ ctx, error: err });
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

export class DendronTreeView implements IDendronTreeView {
  pause?: boolean;

  static register(_context: ExtensionContext) {
    HistoryService.instance().subscribe(
      "extension",
      async (_event: HistoryEvent) => {
        if (_event.action === "initialized") {
          const ws = getExtension();
          const treeDataProvider = new EngineNoteProvider();
          await treeDataProvider.getChildren();
          const treeView = window.createTreeView(DendronTreeViewKey.TREE_VIEW, {
            treeDataProvider,
            showCollapseAll: true,
          });
          const _class = new DendronTreeView(treeView, treeDataProvider);
          ws.dendronTreeView = _class;
        }
      }
    );
  }

  constructor(
    public treeView: TreeView<string>,
    public treeProvider: EngineNoteProvider
  ) {
    getExtension().addDisposable(
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
    const { wsRoot, vaults, engine } = getDWorkspace();
    const ext = getExtension();
    if (!ext.workspaceService?.isPathInWorkspace(uri.fsPath)) {
      return;
    }
    if (basename.endsWith(".md")) {
      const vault = VaultUtils.getVaultByFilePath({
        fsPath: uri.fsPath,
        wsRoot,
        vaults,
      });
      const fname = NoteUtils.uri2Fname(uri);
      const note = NoteUtils.getNoteByFnameV5({
        fname,
        vault,
        notes: engine.notes,
        wsRoot,
      }) as NoteProps;
      if (note && !this.pause) {
        this.treeView.reveal(note.id);
      }
    }
  }
}
