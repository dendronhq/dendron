import {
  getAllImportPods,
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

export { CommandCLIOpts as ImportPodCLIOpts };

export class ImportPodCLICommand extends PodCLICommand {
  static getPods() {
    return getAllImportPods();
  }

  static async buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    const podItems: PodItem[] = ImportPodCLICommand.getPods().map((p) =>
      podClassEntryToPodItem(p)
    );
    return ImportPodCLICommand.buildArgsCore(args, podItems);
  }

  static async run(args: CommandCLIOpts) {
    const ctx = "ImportPod:run";
    const cmd = new ImportPodCLICommand();
    cmd.L.info({ ctx, msg: "enter", args });
    const pods = await ImportPodCLICommand.getPods();
    const opts = await cmd.enrichArgs(args, pods);
    cmd.L.info({ ctx, msg: "enrichArgs:post", args });
    await cmd.execute(opts);
    cmd.L.info({ ctx, msg: "exit", args });
    return cmd;
  }
}
