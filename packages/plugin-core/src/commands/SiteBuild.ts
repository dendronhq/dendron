import { BuildSiteV2CLICommandOpts } from "@dendronhq/dendron-cli";
import { execa } from "@dendronhq/engine-server";
import { env, Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { checkPreReq, getSiteRootDirPath } from "../utils/site";
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
    const cmdBuild = `dendron-cli buildSiteV2 --wsRoot ${wsRoot} --stage prod --enginePort ${port}`.split(
      " "
    );
    await execa("npx", cmdBuild, {
      cwd: wsRoot,
    });
  }
  async showResponse() {
    window
      .showInformationMessage(
        `build complete. files available at ${getSiteRootDirPath()}`,
        "Open Folder"
      )
      .then((resp) => {
        if (resp === "Open Folder") {
          env.openExternal(Uri.parse(getSiteRootDirPath()));
        }
      });
  }
}
