import { BuildSiteV2CLICommandOpts } from "@dendronhq/dendron-cli";
import { execa } from "@dendronhq/engine-server";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { checkPreReq } from "../utils/site";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = Partial<BuildSiteV2CLICommandOpts>;

type CommandOutput = void;

export class SiteBuildCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.SITE_BUILD.key;

  async gatherInputs(): Promise<any> {
    return {};
  }

  async sanityCheck() {
    return checkPreReq();
  }

  async execute(_opts?: CommandOpts) {
    const wsRoot = DendronWorkspace.wsRoot();
    window.showInformationMessage("building...");
    const port = DendronWorkspace.instance().port!;
    // TODO: show progress
    const cmdBuild = `npx dendron-cli buildSiteV2 --wsRoot ${wsRoot} --stage prod --enginePort ${port}`;
    await execa.command(cmdBuild, {
      shell: true,
      cwd: wsRoot,
    });
  }
  async showResponse() {
    window.showInformationMessage("SiteBuild completed");
  }
}
