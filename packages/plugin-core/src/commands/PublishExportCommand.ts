import { NextjsExportPodUtils, PublishTarget } from "@dendronhq/pods-core";
import _ from "lodash";
import { DENDRON_EMOJIS } from "@dendronhq/common-all";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { checkPreReq, NextJSPublishUtils } from "../utils/site";
import { BasicCommand } from "./base";
import { VSCodeUtils } from "../utils";

type CommandOpts = void;

type CommandOutput = {
  nextPath: string;
};

export class PublishExportCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.PUBLISH_EXPORT.key;

  async gatherInputs(): Promise<any> {
    return {};
  }

  async sanityCheck() {
    return checkPreReq();
  }

  async execute() {
    const ctx = "PublishExportCommand";
    this.L.info({ ctx, msg: "enter" });

    const prepareOut = await NextJSPublishUtils.prepareNextJSExportPod();

    const { enrichedOpts, wsRoot, cmd, nextPath } = prepareOut;
    // nextPath = path.join(wsRoot, nextPath);
    this.L.info({ ctx, msg: "prepare", enrichedOpts, nextPath });

    if (_.isUndefined(enrichedOpts)) {
      return { nextPath };
    }

    // check if we need to remove .next
    const nextPathExists = await NextjsExportPodUtils.nextPathExists({
      nextPath,
      quiet: true,
    });

    if (nextPathExists) {
      await NextJSPublishUtils.removeNextPath(nextPath);
    }

    // init.
    await NextJSPublishUtils.initialize(nextPath);

    // build
    const skipBuild = await NextJSPublishUtils.promptSkipBuild();
    if (!skipBuild) {
      const { podChoice, config } = enrichedOpts;
      await NextJSPublishUtils.build(cmd, podChoice, config);
    }

    // export
    await NextJSPublishUtils.export(nextPath);

    const target = await VSCodeUtils.showQuickPick(["None", "github"], {
      title: "Select export target.",
      ignoreFocusOut: true,
    });
    if (target && target !== "None") {
      await NextJSPublishUtils.handlePublishTarget(
        target as PublishTarget,
        nextPath,
        wsRoot
      );
    }

    return { nextPath };
  }

  async showResponse(opts: CommandOutput) {
    const { nextPath } = opts;
    window.showInformationMessage(
      `NextJS template initialized at ${nextPath}, and exported to ${nextPath}/out ${DENDRON_EMOJIS.SEEDLING}`
    );
  }
}
