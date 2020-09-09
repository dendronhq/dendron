import {
  getAllExportPods,
  podClassEntryToPodItem,
  PodItem,
} from "@dendronhq/pods-core";
import yargs from "yargs";
import { PodCLICommand } from "./pod";

type CommandCLIOpts = {
  podId: string;
  podsDir: string;
  vault: string;
};

export { CommandCLIOpts as ExportPodCLIOpts };

export class ExportPodCLICommand extends PodCLICommand {
  static async buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    const podItems: PodItem[] = ExportPodCLICommand.getPods().map((p) =>
      podClassEntryToPodItem(p)
    );
    return ExportPodCLICommand.buildArgsCore(args, podItems);
  }

  static getPods() {
    return getAllExportPods();
  }

  static async run(args: CommandCLIOpts) {
    const cmd = new ExportPodCLICommand();
    const pods = await ExportPodCLICommand.getPods();
    const opts = await cmd.enrichArgs(args, pods);
    return cmd.execute(opts);
  }
}
