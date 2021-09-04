import {
  PodItemV4,
  SnapshotExportPod,
  SnapshotExportPodResp,
} from "@dendronhq/pods-core";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { getDWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = {};

type CommandInput = { podChoice: PodItemV4 };

type CommandOutput = SnapshotExportPodResp;
export { CommandOpts as SnapshotVaultCommandOpts };

export class SnapshotVaultCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SNAPSHOT_VAULT.key;
  async gatherInputs(): Promise<any> {
    return {};
  }

  async enrichInputs(_inputs: CommandInput): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(_opts: CommandOpts) {
    const pod = new SnapshotExportPod();
    const { engine } = getDWorkspace();
    const vault = engine.vaults[0];
    const wsRoot = getDWorkspace().wsRoot as string;
    const { data: snapshotDirPath } = await pod.execute({
      vaults: [vault],
      wsRoot,
      engine,
      // @ts-ignore
      config: {},
    });
    window.showInformationMessage(`snapshot made to ${snapshotDirPath}`);
    return { snapshotDirPath };
  }
}
