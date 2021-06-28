import {
  DEngineClient,
  DVault,
  NoteProps,
  NoteUtils,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { file2Note, string2Note } from "@dendronhq/common-server";
import { HistoryService, LinkUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import { AnchorUtils } from "@dendronhq/engine-server";
import path from "path";
import * as vscode from "vscode";
import { Logger } from "./logger";
import { DendronWorkspace, getWS } from "./workspace";
import { ShowPreviewV2Command } from "./commands/ShowPreviewV2";

export class VaultWatcher {
  public watchers: { vault: DVault; watcher: vscode.FileSystemWatcher }[];
  /**
   * Should watching be paused
   */
  public pause: boolean;
  public L = Logger;
  public ws: DendronWorkspace;
  public engine: DEngineClient;

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

  /**
   * Update note links
   * @param uri
   * @returns
   */
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
    if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return;
    }
    const vault = VaultUtils.getVaultByNotePath({
      vaults: eclient.vaults,
      wsRoot: DendronWorkspace.wsRoot(),
      fsPath: uri.fsPath,
    });
    let note = string2Note({ content, fname, vault });
    const noteHydrated = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: eclient.notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NoteProps;
    note = NoteUtils.hydrate({ noteRaw: note, noteHydrated });
    const links = LinkUtils.findLinks({ note, engine: eclient });
    note.links = links;
    const anchors = await AnchorUtils.findAnchors(
      { note, wsRoot: eclient.wsRoot },
      { fname, engine: eclient }
    );
    note.anchors = anchors;
    this.L.info({ ctx, fname, msg: "exit" });
    const noteClean = await eclient.updateNote(note);
    ShowPreviewV2Command.refresh(noteClean);
    return noteClean;
  }

  async onDidCreate(uri: vscode.Uri): Promise<void> {
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
    let note: NoteProps | undefined;
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
        const vault = VaultUtils.getVaultByNotePath({
          vaults: this.engine.vaults,
          fsPath: uri.fsPath,
          wsRoot: DendronWorkspace.wsRoot(),
        });
        note = file2Note(uri.fsPath, vault);

        // check if note exist as
        const maybeNote = NoteUtils.getNoteByFnameV5({
          fname,
          vault,
          notes: this.engine.notes,
          wsRoot: DendronWorkspace.wsRoot(),
        }) as NoteProps;
        if (maybeNote) {
          note = {
            ...note,
            ..._.pick(maybeNote, ["children", "parent"]),
          } as NoteProps;
          delete note["stub"];
          delete note["schemaStub"];
        }

        // add note
        await this.engine.updateNote(note as NoteProps, {
          newNode: true,
        });
      } catch (err) {
        this.L.error({ ctx, error: err });
        throw err;
      }
    } finally {
      VaultWatcher.refreshTree();
      this.L.debug({ ctx, uri, msg: "refreshTree" });
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
