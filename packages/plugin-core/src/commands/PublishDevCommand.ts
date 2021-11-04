import { DENDRON_COMMANDS } from "../constants";
import {
  getSiteRootDirPath,
  checkPreReq,
  NextJSPublishUtils,
} from "../utils/site";
import { BasicCommand } from "./base";
import fs from "fs-extra";
import _ from "lodash";
import { window } from "vscode";
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
    const { enrichedOpts, wsRoot, cmd, nextPath } = prepareOut;
    this.L.info({ ctx, msg: "prepare", enrichedOpts, nextPath });

    if (_.isUndefined(enrichedOpts)) {
      return {};
    }

    const isInitialized = await NextJSPublishUtils.isInitialized(wsRoot);
    if (!isInitialized) {
      await NextJSPublishUtils.initialize(nextPath);
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
        ...["Stop serving"]
      )
      .then(async (resp) => {
        if (resp === "Stop serving") {
          const { pid } = opts;
          process.kill(pid, "SIGTERM");
        }
      });
  }
}
