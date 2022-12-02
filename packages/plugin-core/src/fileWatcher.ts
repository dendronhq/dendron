import {
  ConfigService,
  ContextualUIEvents,
  DVault,
  ErrorUtils,
  NoteProps,
  NoteUtils,
  URI,
  VaultUtils,
  WorkspaceOpts,
  WorkspaceType,
} from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import {
  EngineFileWatcher,
  EngineUtils,
  FileWatcherAdapter,
  HistoryService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { ExtensionProvider } from "./ExtensionProvider";
import { Logger } from "./logger";
import { AnalyticsUtils, sentryReportingCallback } from "./utils/analytics";

export class FileWatcher {
  public watchers: { vault: DVault; watcher: FileWatcherAdapter }[];
  /**
   * Should watching be paused
   */
  public pause: boolean;
  public L = Logger;

  constructor(opts: { workspaceOpts: WorkspaceOpts }) {
    const { workspaceOpts } = opts;

    const { vaults, wsRoot } = workspaceOpts;
    this.watchers = vaults.map((vault) => {
      const vpath = path.join(
        wsRoot,
        VaultUtils.normVaultPath({ vault, wsRoot })
      );
      const rootFolder = vpath;
      const pattern = new vscode.RelativePattern(rootFolder, "*.md");

      let watcher: FileWatcherAdapter;
      // For VSCode workspaces, or if forced in the config, use the VSCode watcher
      if (FileWatcher.watcherType(workspaceOpts) === "plugin") {
        watcher = new PluginFileWatcher(pattern);
      } else {
        watcher = new EngineFileWatcher(pattern.base, pattern.pattern);
      }

      return { vault, watcher };
    });
    this.pause = false;
  }

  static watcherType(opts: WorkspaceOpts): "plugin" | "engine" {
    const forceWatcherType = opts.dendronConfig?.dev?.forceWatcherType;
    // If a certain type of watcher has been forced, try to use that
    if (forceWatcherType !== undefined) return forceWatcherType;

    const wsType = ExtensionProvider.getDWorkspace().type;
    // For VSCode workspaces, use the built-in VSCode watcher
    if (wsType === WorkspaceType.CODE) return "plugin";
    // Otherwise, use the engine watcher that works without VSCode
    return "engine";
  }

  activate(context: vscode.ExtensionContext) {
    this.watchers.forEach(({ watcher }) => {
      context.subscriptions.push(
        watcher.onDidCreate(
          sentryReportingCallback(this.onDidCreate.bind(this))
        )
      );
      context.subscriptions.push(
        watcher.onDidDelete(
          sentryReportingCallback(this.onDidDelete.bind(this))
        )
      );
    });
  }

  async onDidCreate(fsPath: string): Promise<void> {
    const ctx = "FileWatcher:onDidCreate";
    if (this.pause) {
      this.L.info({ ctx, fsPath, msg: "paused" });
      return;
    }
    this.L.info({ ctx, fsPath });
    const fname = path.basename(fsPath, ".md");

    // check if ignore
    const recentEvents = HistoryService.instance().lookBack();
    this.L.debug({ ctx, recentEvents, fname });
    let note: NoteProps;
    if (
      _.find(recentEvents, (event) => {
        return _.every([
          event?.uri?.fsPath === fsPath,
          event.source === "engine",
          event.action === "create",
        ]);
      })
    ) {
      this.L.debug({ ctx, fsPath, msg: "create by engine, ignoring" });
      return;
    }

    try {
      this.L.debug({ ctx, fsPath, msg: "pre-add-to-engine" });
      const ws = ExtensionProvider.getDWorkspace();
      const { engine, wsRoot } = ws;
      const vaults = await ws.vaults;
      const vault = VaultUtils.getVaultByFilePath({
        vaults,
        fsPath,
        wsRoot,
      });
      const resp = file2Note(fsPath, vault);
      if (ErrorUtils.isErrorResp(resp)) {
        throw resp.error;
      }
      note = resp.data;

      // check if note exist as
      const maybeNote = (await engine.findNotesMeta({ fname, vault }))[0];
      if (maybeNote) {
        note = NoteUtils.hydrate({ noteRaw: note, noteHydrated: maybeNote });
        delete note["stub"];
        delete note["schemaStub"];
        //TODO recognise vscode's create new file menu option to create a note.
      }
      const configReadResult = await ConfigService.instance().readConfig(
        URI.file(engine.wsRoot)
      );
      if (configReadResult.isErr()) {
        throw configReadResult.error;
      }
      const config = configReadResult.value;
      await EngineUtils.refreshNoteLinksAndAnchors({
        note,
        fmChangeOnly: false,
        engine,
        config,
      });
      await engine.writeNote(note, { metaOnly: true });
    } catch (err: any) {
      this.L.error({ ctx, error: err });
      throw err;
    }
  }

  async onDidDelete(fsPath: string) {
    const ctx = "FileWatcher:onDidDelete";
    if (this.pause) {
      return;
    }
    this.L.info({ ctx, fsPath });
    const fname = path.basename(fsPath, ".md");

    // check if we should ignore
    const recentEvents = HistoryService.instance().lookBack(5);
    this.L.debug({ ctx, recentEvents, fname });
    if (
      _.find(recentEvents, (event) => {
        return _.every([
          event?.uri?.fsPath === fsPath,
          event.source === "engine",
          _.includes(["delete", "rename"], event.action),
        ]);
      })
    ) {
      this.L.debug({
        ctx,
        fsPath,
        msg: "recent action by engine, ignoring",
      });
      return;
    }
    try {
      const ws = ExtensionProvider.getDWorkspace();
      const { engine, wsRoot } = ws;
      const vaults = await ws.vaults;
      const vault = VaultUtils.getVaultByFilePath({
        vaults,
        fsPath,
        wsRoot,
      });
      this.L.debug({ ctx, fsPath, msg: "preparing to delete" });
      const nodeToDelete = (await engine.findNotesMeta({ fname, vault }))[0];
      if (_.isUndefined(nodeToDelete)) {
        throw new Error(`${fname} not found`);
      }
      await engine.deleteNote(nodeToDelete.id, { metaOnly: true });
      HistoryService.instance().add({
        action: "delete",
        source: "watcher",
        uri: vscode.Uri.parse(fsPath),
      });
      AnalyticsUtils.track(ContextualUIEvents.ContextualUIDelete);
    } catch (err) {
      this.L.info({ ctx, fsPath, err });
      // NOTE: ignore, many legitimate reasons why this might happen
      // this.L.error({ ctx, err: JSON.stringify(err) });
    }
  }
}

export class PluginFileWatcher implements FileWatcherAdapter {
  private watcher: vscode.FileSystemWatcher;
  constructor(pattern: vscode.GlobPattern) {
    this.watcher = vscode.workspace.createFileSystemWatcher(
      pattern,
      false,
      false,
      false
    );
  }

  onDidCreate(callback: (filePath: string) => void) {
    return this.watcher.onDidCreate((uri) => callback(uri.fsPath));
  }

  onDidDelete(callback: (filePath: string) => void) {
    return this.watcher.onDidDelete((uri) => callback(uri.fsPath));
  }

  onDidChange(callback: (filePath: string) => void) {
    return this.watcher.onDidChange((uri) => callback(uri.fsPath));
  }
}
