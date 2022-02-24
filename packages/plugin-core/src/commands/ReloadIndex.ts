import {
  DEngineClient,
  DVault,
  ERROR_SEVERITY,
  NoteUtils,
  SchemaUtils,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  note2File,
  schemaModuleOpts2File,
  vault2Path,
} from "@dendronhq/common-server";
import { Git } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { ProgressLocation, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { BasicCommand } from "./base";

type ReloadIndexCommandOpts = {
  silent?: boolean;
};

export class ReloadIndexCommand extends BasicCommand<
  ReloadIndexCommandOpts,
  DEngineClient | undefined
> {
  key = DENDRON_COMMANDS.RELOAD_INDEX.key;
  silent = true;

  /** Create the root schema if it is missing. */
  private async createRootSchemaIfMissing(wsRoot: string, vault: DVault) {
    const ctx = "ReloadIndex.createRootSchemaIfMissing";
    const vaultDir = vault2Path({ wsRoot, vault });
    const rootSchemaPath = path.join(vaultDir, "root.schema.yml");
    // If it already exists, nothing to do
    if (await fs.pathExists(rootSchemaPath)) return;

    const schema = SchemaUtils.createRootModule({ vault });
    this.L.info({ ctx, vaultDir, msg: "creating root schema" });
    await schemaModuleOpts2File(schema, vaultDir, "root");
  }

  /** Creates the root note if it is missing. */
  private async createRootNoteIfMisisng(wsRoot: string, vault: DVault) {
    const ctx = "ReloadIndex.createRootNoteIfMissing";
    const vaultDir = vault2Path({ wsRoot, vault });
    const rootNotePath = path.join(vaultDir, "root.md");
    // If it already exists, nothing to do
    if (await fs.pathExists(rootNotePath)) return;

    const note = NoteUtils.createRoot({ vault });
    this.L.info({ ctx, vaultDir, msg: "creating root note" });
    await note2File({
      note,
      vault,
      wsRoot,
    });
  }

  /** Convert a local vault to a remote vault if it is in a git repository and has a remote set. */
  private async convertToRemoteVaultIfPossible(wsRoot: string, vault: DVault) {
    const ctx = "ReloadIndex.convertToRemoteVaultIfPossible";
    const vaultDir = vault2Path({ wsRoot, vault });
    const gitPath = path.join(vaultDir, ".git");
    // Already a remote vault
    if (vault.remote !== undefined) return;
    // Not a git repository, nothing to convert
    if (!(await fs.pathExists(gitPath))) return;

    const git = new Git({ localUrl: vaultDir });
    const remoteUrl = await git.getRemoteUrl();
    // We can't convert if there is no remote
    if (!remoteUrl) return;

    // Need the workspace service to function
    const { workspaceService } = ExtensionProvider.getExtension();
    if (!workspaceService) return;
    this.L.info({
      ctx,
      vaultDir,
      remoteUrl,
      msg: "converting local vault to a remote vault",
    });
    workspaceService.markVaultAsRemoteInConfig(vault, remoteUrl);
  }

  /**
   * Update index
   * @param opts
   */
  async execute(
    opts?: ReloadIndexCommandOpts
  ): Promise<DEngineClient | undefined> {
    const ctx = "ReloadIndex.execute";
    this.L.info({ ctx, msg: "enter" });
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot, engine } = ws;

    // Fix up any broken vaults
    const reloadIndex = async () => {
      await Promise.all(
        engine.vaults.flatMap((vault) => {
          return [
            this.createRootSchemaIfMissing(wsRoot, vault),
            this.createRootNoteIfMisisng(wsRoot, vault),
            this.convertToRemoteVaultIfPossible(wsRoot, vault),
          ];
        })
      );

      const start = process.hrtime();
      const { error } = await engine.init();
      const durationEngineInit = getDurationMilliseconds(start);
      this.L.info({ ctx, durationEngineInit });

      // if fatal, stop initialization
      if (error && error.severity !== ERROR_SEVERITY.MINOR) {
        this.L.error({ ctx, error, msg: "unable to initialize engine" });
        return;
      }
      if (error) {
        const msg = "init error";
        this.L.error({ ctx, error, msg });
      }
    };

    if (!(opts && !opts.silent)) {
      await reloadIndex();
    } else {
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: "Reloading Index...",
          cancellable: false,
        },
        reloadIndex
      );
    }

    this.L.info({ ctx, msg: "exit" });
    return engine;
  }
}
