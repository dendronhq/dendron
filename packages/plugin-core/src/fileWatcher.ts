import { DEngineClientV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Logger } from "./logger";
import { HistoryService } from "./services/HistoryService";
import { DendronWorkspace } from "./workspace";

export class VaultWatcher {
  public watcher: vscode.FileSystemWatcher;
  public L = Logger;
  public ws: DendronWorkspace;
  public engine: DEngineClientV2;

  constructor({ vaults }: { vaults: vscode.WorkspaceFolder[] }) {
    const rootFolder = vaults[0];
    const pattern = new vscode.RelativePattern(rootFolder, "*.md");
    const watcher = vscode.workspace.createFileSystemWatcher(
      pattern,
      false,
      true,
      false
    );
    this.watcher = watcher;
    this.ws = DendronWorkspace.instance();
    this.engine = this.ws.getEngine();
  }

  activate() {
    const disposables = [];
    disposables.push(this.watcher.onDidCreate(this.onDidCreate, this));
    disposables.push(this.watcher.onDidDelete(this.onDidDelete, this));
    return disposables;
  }

  async onDidCreate(uri: vscode.Uri) {
    const ctx = "VaultWatcher:onDidCreate";
    this.L.info({ ctx, uri });
    const fname = path.basename(uri.fsPath, ".md");

    // check if ignore
    const recentEvents = HistoryService.instance().lookBack();
    this.L.debug({ ctx, recentEvents, fname });
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
        let note = file2Note(uri.fsPath);
        const maybeNote = NoteUtilsV2.getNoteByFname(fname, this.engine.notes);
        if (maybeNote) {
          note = {
            ...note,
            stub: false,
            schemaStub: false,
            ..._.pick(maybeNote, ["children", "parent"]),
          };
        }
        await this.engine.updateNote(note, {
          newNode: true,
        });
        this.L.debug({ ctx, uri, msg: "post-add-to-engine", note });
      } catch (err) {
        this.L.error({ ctx, err });
      }
    } finally {
      this.L.debug({ ctx, uri, msg: "refreshTree" });
      VaultWatcher.refreshTree();
    }
  }

  async onDidDelete(uri: vscode.Uri) {
    const ctx = "VaultWatcher:onDidDelete";
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
