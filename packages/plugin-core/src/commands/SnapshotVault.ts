import {
  PodItemV4,
  SnapshotExportPod,
  SnapshotExportPodResp,
} from "@dendronhq/pods-core";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = {};

type CommandInput = { podChoice: PodItemV4 };

type CommandOutput = SnapshotExportPodResp;
export { CommandOpts as SnapshotVaultCommandOpts };

export class SnapshotVaultCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.SNAPSHOT_VAULT.key;
  async gatherInputs(): Promise<any> {
    return {};
  }

  async enrichInputs(_inputs: CommandInput): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(_opts: CommandOpts) {
    const pod = new SnapshotExportPod();
    const engine = DendronWorkspace.instance().getEngine();
    const vault = engine.vaults[0];
    const wsRoot = DendronWorkspace.rootDir() as string;
    const { snapshotDirPath } = await pod.execute({
      vaults: [{ fsPath: vault }],
      wsRoot,
      engine,
      config: {},
    });
    window.showInformationMessage(`snapshot made to ${snapshotDirPath}`);
    return { snapshotDirPath };
  }
}
