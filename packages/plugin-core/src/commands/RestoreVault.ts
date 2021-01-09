import { Time } from "@dendronhq/common-all";
import { SnapshotImportPod } from "@dendronhq/pods-core";
import fs, { readdirSync } from "fs-extra";
import path from "path";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = { src: string };

type CommandInput = { data: string };

type CommandOutput = void;
export { CommandOpts as RestoreVaultCommandOpts };

export class RestoreVaultCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.RESTORE_VAULT.key;
  async gatherInputs(): Promise<any> {
    const snapshots = path.join(
      DendronWorkspace.wsRoot() as string,
      "snapshots"
    );

    const choices = readdirSync(snapshots)
      .sort()
      .map((ent) => ({
        label: `${Time.DateTime.fromMillis(parseInt(ent)).toLocaleString(
          Time.DateTime.DATETIME_FULL
        )} (${ent})`,
        data: ent,
      }));
    return VSCodeUtils.showQuickPick(choices);
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    const snapshots = path.join(
      DendronWorkspace.wsRoot() as string,
      "snapshots"
    );
    const { data } = inputs;
    const src = path.join(snapshots, data);
    if (!fs.existsSync(src)) {
      window.showErrorMessage(`${src} does not exist`);
      return;
    }
    return { src };
  }

  async execute(opts: CommandOpts) {
    const ws = DendronWorkspace.instance();
    try {
      const { src } = opts;
      const pod = new SnapshotImportPod();
      const engine = DendronWorkspace.instance().getEngine();
      const vault = engine.vaultsv3[0];
      const wsRoot = DendronWorkspace.wsRoot() as string;
      if (ws.vaultWatcher) {
        ws.vaultWatcher.pause = true;
      }
      if (ws.schemaWatcher) {
        ws.schemaWatcher.pause = true;
      }
      await pod.execute({
        vaults: [vault],
        wsRoot,
        engine,
        config: { src },
      });
      window.showInformationMessage(`restored from snapshot`);
      await ws.reloadWorkspace();
      return;
    } finally {
      if (ws.vaultWatcher) {
        ws.vaultWatcher.pause = false;
      }
      if (ws.schemaWatcher) {
        ws.schemaWatcher.pause = false;
      }
    }
  }
}
