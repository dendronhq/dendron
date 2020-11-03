import {
  getAllExportPods,
  podClassEntryToPodItemV4,
  PodItemV4,
} from "@dendronhq/pods-core";
import yargs from "yargs";
import { CommandCLIOpts, PodCLICommand } from "./pod";

export { CommandCLIOpts as ExportPodCLIOpts };

export class ExportPodCLICommand extends PodCLICommand {
  static async buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    const podItems: PodItemV4[] = ExportPodCLICommand.getPods().map((p) =>
      podClassEntryToPodItemV4(p)
    );
    return ExportPodCLICommand.buildArgsCore(args, podItems);
  }

  static getPods() {
    return getAllExportPods();
  }

  static async run(args: CommandCLIOpts) {
    try {
      const cmd = new ExportPodCLICommand();
      const pods = await ExportPodCLICommand.getPods();
      const opts = await cmd.enrichArgs(args, pods, "export");
      return cmd.execute(opts);
    } catch (err) {
      console.log(err);
    }
  }
}
