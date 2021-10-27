import { BuildSiteV2CLICommandOpts } from "@dendronhq/dendron-cli";
import { env, Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { buildSite, checkPreReq, getSiteRootDirPath } from "../utils/site";
import { getExtension, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = Partial<BuildSiteV2CLICommandOpts>;

type CommandOutput = void;

export class PublishExportCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.PUBLISH_EXPORT.key;

  async gatherInputs(): Promise<any> {
    return {};
  }

  async sanityCheck() {
    return checkPreReq();
    // return undefined;
  }

  async execute(_opts?: CommandOpts) {
    const wsRoot = getDWorkspace().wsRoot;
    window.showInformationMessage("building...");
    const port = getExtension().port!;
    await buildSite({
      wsRoot,
      stage: "prod",
      enginePort: port,
      serve: false,
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
