import { DENDRON_COMMANDS } from "../constants";
import {
  getSiteRootDirPath,
  checkPreReq,
  NextJSPublishUtils,
} from "../utils/site";
import { BasicCommand } from "./base";
import fs from "fs-extra";
import path from "path";
import _ from "lodash";
import kill from "tree-kill";
import { commands, Uri, window } from "vscode";
import { DENDRON_EMOJIS } from "@dendronhq/common-all";

type CommandOutput = {
  pid: number;
};

export class PublishDevCommand extends BasicCommand<CommandOutput> {
  key = DENDRON_COMMANDS.PUBLISH_DEV.key;

  async gatherInputs(): Promise<any> {
    return {};
  }

  async sanityCheck() {
    const sitePath = getSiteRootDirPath();
    if (!fs.existsSync(sitePath)) {
      fs.ensureDirSync(sitePath);
    }
    return checkPreReq();
  }

  async execute() {
    const ctx = "PublishDevCommand";
    this.L.info({ ctx, msg: "enter" });
    const prepareOut = await NextJSPublishUtils.prepareNextJSExportPod();

    const { enrichedOpts, wsRoot, cmd } = prepareOut;
    let { nextPath } = prepareOut;
    nextPath = path.join(wsRoot, nextPath);
    this.L.info({ ctx, msg: "prepare", enrichedOpts, nextPath });

    if (_.isUndefined(enrichedOpts)) {
      return {};
    }

    const skipBuild = await NextJSPublishUtils.promptSkipBuild();
    this.L.info({ ctx, msg: "skipBuild?", skipBuild });
    if (!skipBuild) {
      const { podChoice, config } = enrichedOpts;
      await NextJSPublishUtils.build(cmd, podChoice, config);
    }

    this.L.info({ ctx, msg: "starting dev" });
    const pid = await NextJSPublishUtils.dev(nextPath);

    return { pid };
  }

  async showResponse(opts: CommandOutput) {
    window
      .showInformationMessage(
        `Server is running on localhost:3000 ${DENDRON_EMOJIS.SEEDLING}`,
        ...["Open in browser", "Stop serving"]
      )
      .then(async (resp) => {
        if (resp === "Open in browser") {
          await commands.executeCommand(
            "vscode.open",
            Uri.parse("localhost:3000")
          );
        } else {
          const { pid } = opts;
          console.log({ pid });
          kill(pid, "SIGTERM");
        }
      });
  }
}
