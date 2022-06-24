import { InputArgs, getVisualizationMarkup } from "@dendronhq/dendron-viz";
import { Argv } from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { setupEngine, setupEngineArgs, SetupEngineResp } from "./utils";
import * as fs from "fs-extra";
import { VaultUtils } from "@dendronhq/common-all";
import path from "path";

type CommandOpts = InputArgs & SetupEngineResp & CommandCommonProps;

export { CommandOpts as VisualizeCLICommandOpts };

export class VisualizeCLICommand extends CLICommand {
  constructor() {
    super({
      name: "visualize",
      desc: "generates a packed circles visualization of Dendron workspace",
    });
  }

  buildArgs(args: Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.option("out", { description: "path to the output file " });
  }

  async enrichArgs(args: any) {
    /* Instantiate an engine and pass it to the execute method as part of the argument */
    const engineArgs = await setupEngine(args);
    return { data: { ...args, ...engineArgs } };
  }

  async execute(opts: CommandOpts) {
    const { out, engine, wsRoot } = opts;

    /* Ensure that the provided directory exists. If not present, this creates the directory */
    if (out) await fs.ensureDir(out);

    if (!engine) throw new Error("Engine is not initialized");

    await Promise.all(
      engine.vaults.map(async (vault) => {
        /* Get vault name */
        const vaultName = VaultUtils.getName(vault);
        const outputFile = path.join(out || wsRoot, `diagram-${vaultName}.svg`);
        /* Create React component for visualization */
        const html = await getVisualizationMarkup({
          ...opts,
          vault,
          notes: engine.notes,
        });
        /* Write markup to the output file */
        await fs.writeFile(outputFile, html);
      })
    );

    return { exit: true };
  }
}
