import { Time, VaultUtils } from "@dendronhq/common-all";
import { SnapshotImportPod } from "@dendronhq/pods-core";
import fs, { readdirSync } from "fs-extra";
import path from "path";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils, WSUtils } from "../utils";
import { getExtension, getDWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = { src: string };

type CommandInput = { data: string };

type CommandOutput = void;
export { CommandOpts as RestoreVaultCommandOpts };

export class RestoreVaultCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  key = DENDRON_COMMANDS.RESTORE_VAULT.key;
  async gatherInputs(): Promise<any> {
    const snapshots = path.join(getDWorkspace().wsRoot as string, "snapshots");

    const choices = readdirSync(snapshots)
      .sort()
      .map((ent) => ({
        label: `${Time.DateTime.fromMillis(parseInt(ent, 10)).toLocaleString(
          Time.DateTime.DATETIME_FULL
        )} (${ent})`,
        data: ent,
      }));
    return VSCodeUtils.showQuickPick(choices);
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    const snapshots = path.join(getDWorkspace().wsRoot as string, "snapshots");
    const { data } = inputs;
    const src = path.join(snapshots, data);
    if (!fs.existsSync(src)) {
      window.showErrorMessage(`${src} does not exist`);
      return;
    }
    return { src };
  }

  async execute(opts: CommandOpts) {
    const ext = getExtension();
    const { engine, vaults, wsRoot } = getDWorkspace();
    try {
      const { src } = opts;
      const pod = new SnapshotImportPod();
      const vault = vaults[0];
      if (ext.fileWatcher) {
        ext.fileWatcher.pause = true;
      }
      if (ext.schemaWatcher) {
        ext.schemaWatcher.pause = true;
      }
      await pod.execute({
        vaults: [vault],
        wsRoot,
        engine,
        config: { src, vaultName: VaultUtils.getName(vault) },
      });
      window.showInformationMessage(`restored from snapshot`);
      await WSUtils.reloadWorkspace();
      return;
    } finally {
      if (ext.fileWatcher) {
        ext.fileWatcher.pause = false;
      }
      if (ext.schemaWatcher) {
        ext.schemaWatcher.pause = false;
      }
    }
  }
}
