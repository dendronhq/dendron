import {
  DEngineClientV2,
  DVault,
  NotePropsV2,
  NoteUtilsV2,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { file2Note, string2Note } from "@dendronhq/common-server";
import { HistoryService, ParserUtilsV2 } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Logger } from "./logger";
import { DendronWorkspace } from "./workspace";

export class VaultWatcher {
  public watchers: { vault: DVault; watcher: vscode.FileSystemWatcher }[];
  /**
   * Should watching be paused
   */
  public pause: boolean;
  public L = Logger;
  public ws: DendronWorkspace;
  public engine: DEngineClientV2;

  constructor(opts: WorkspaceOpts) {
    const { vaults, wsRoot } = opts;
    this.watchers = vaults.map((vault) => {
      const vpath = path.join(
        wsRoot,
        VaultUtils.normVaultPath({ vault, wsRoot })
      );
      const rootFolder = vpath;
      const pattern = new vscode.RelativePattern(rootFolder, "*.md");
      const watcher = vscode.workspace.createFileSystemWatcher(
        pattern,
        false,
        false,
        false
      );
      return { vault, watcher };
    });
    this.ws = DendronWorkspace.instance();
    this.engine = this.ws.getEngine();
    this.pause = false;
  }

  activate(context: vscode.ExtensionContext) {
    this.watchers.forEach(({ watcher }) => {
      context.subscriptions.push(watcher.onDidCreate(this.onDidCreate, this));
      context.subscriptions.push(watcher.onDidDelete(this.onDidDelete, this));
      context.subscriptions.push(
        watcher.onDidChange(_.debounce(this.onDidChange, 500), this)
      );
    });
  }

  async onDidChange(uri: vscode.Uri) {
    const ctx = "VaultWatcher:onDidChange";
    this.L.debug({ ctx, uri: uri.fsPath });
    if (this.pause) {
      return;
    }
    this.L.info({ ctx, uri });
    const eclient = DendronWorkspace.instance().getEngine();
    const fname = path.basename(uri.fsPath, ".md");
    const doc = await vscode.workspace.openTextDocument(uri);
    const content = doc.getText();
    const vault = VaultUtils.getVaultByNotePathV4({
      vaults: eclient.vaultsv3,
      wsRoot: DendronWorkspace.wsRoot(),
      fsPath: uri.fsPath,
    });
    let note = string2Note({ content, fname, vault });
    const noteHydrated = NoteUtilsV2.getNoteByFnameV5({
      fname,
      vault,
      notes: eclient.notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NotePropsV2;
    note = NoteUtilsV2.hydrate({ noteRaw: note, noteHydrated });
    const links = ParserUtilsV2.findLinks({ note });
    note.links = links;
    this.L.info({ ctx, fname, msg: "exit" });
    return await eclient.updateNote(note);
  }

  async onDidCreate(uri: vscode.Uri): Promise<NotePropsV2 | undefined> {
    const ctx = "VaultWatcher:onDidCreate";
    if (this.pause) {
      this.L.info({ ctx, uri, msg: "paused" });
      return;
    }
    this.L.info({ ctx, uri });
    const fname = path.basename(uri.fsPath, ".md");

    // check if ignore
    const recentEvents = HistoryService.instance().lookBack();
    this.L.debug({ ctx, recentEvents, fname });
    let note: NotePropsV2 | undefined;
    try {
      if (
        _.find(recentEvents, (event) => {
          return _.every([
            event?.uri?.fsPath === uri.fsPath,
            event.source === "engine",
            event.action === "create",
          ]);
        })
      ) {
        this.L.debug({ ctx, uri, msg: "create by engine, ignoring" });
        return;
      }

      try {
        this.L.debug({ ctx, uri, msg: "pre-add-to-engine" });
        const vault = VaultUtils.getVaultByNotePathV4({
          vaults: this.engine.vaultsv3,
          fsPath: uri.fsPath,
          wsRoot: DendronWorkspace.wsRoot(),
        });
        note = file2Note(uri.fsPath, vault);
        const maybeNote = NoteUtilsV2.getNoteByFnameV5({
          fname,
          vault,
          notes: this.engine.notes,
          wsRoot: DendronWorkspace.wsRoot(),
        }) as NotePropsV2;
        if (maybeNote) {
          note = {
            ...note,
            stub: false,
            schemaStub: false,
            ..._.pick(maybeNote, ["children", "parent"]),
          } as NotePropsV2;
        }
        await this.engine.updateNote(note as NotePropsV2, {
          newNode: true,
        });
        this.L.debug({ ctx, uri, msg: "post-add-to-engine", note });
        return note;
      } catch (err) {
        this.L.error({ ctx, err });
        return note;
      }
    } finally {
      this.L.debug({ ctx, uri, msg: "refreshTree" });
      VaultWatcher.refreshTree();
      return note;
    }
  }

  async onDidDelete(uri: vscode.Uri) {
    const ctx = "VaultWatcher:onDidDelete";
    if (this.pause) {
      return;
    }
    try {
      this.L.info({ ctx, uri });
      const fname = path.basename(uri.fsPath, ".md");

      // check if we should ignore
      const recentEvents = HistoryService.instance().lookBack(5);
      this.L.debug({ ctx, recentEvents, fname });
      if (
        _.find(recentEvents, (event) => {
          return _.every([
            event?.uri?.fsPath === uri.fsPath,
            event.source === "engine",
            _.includes(["delete", "rename"], event.action),
          ]);
        })
      ) {
        this.L.debug({
          ctx,
          uri,
          msg: "recent action by engine, ignoring",
        });
        return;
      }
      try {
        this.L.debug({ ctx, uri, msg: "preparing to delete" });
        const nodeToDelete = _.find(this.engine.notes, { fname });
        if (_.isUndefined(nodeToDelete)) {
          throw `${fname} not found`;
        }
        await this.engine.deleteNote(nodeToDelete.id, { metaOnly: true });
        await HistoryService.instance().add({
          action: "delete",
          source: "watcher",
          uri: uri,
        });
      } catch (err) {
        this.L.info({ ctx, uri, err });
        // NOTE: ignore, many legitimate reasons why this might happen
        // this.L.error({ ctx, err: JSON.stringify(err) });
      }
    } finally {
      VaultWatcher.refreshTree();
    }
  }

  static refreshTree = _.debounce(() => {
    const ctx = "refreshTree";
    Logger.info({ ctx });
    DendronWorkspace.instance().dendronTreeView?.treeProvider.refresh();
  }, 100);
}
