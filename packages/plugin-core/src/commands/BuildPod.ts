import { DEngineClientV2 } from "@dendronhq/common-all";
import { BuildSiteCommand } from "@dendronhq/dendron-cli";
import _ from "lodash";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getEngine } from "../workspace";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type CommandOpts = { skipReload?: boolean };

type CommandOutput = void;

export class BuildPodCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.BUILD_POD.key;
  async execute(opts: CommandOpts) {
    const ctx = { ctx: "PlantNotesCommand", opts };
    const { writeStubs, incremental } = _.defaults(opts, {
      writeStubs: false,
      incremental: false,
    });
    const ws = DendronWorkspace.instance();
    let engine = getEngine();
    if (!opts.skipReload) {
      this.L.info({ ctx, msg: "doing reload..." });
      engine = (await new ReloadIndexCommand().execute()) as DEngineClientV2;
    }
    const config = ws.config?.site;
    if (_.isUndefined(config)) {
      throw Error("no config found");
    }
    const cmd = new BuildSiteCommand();
    // @ts-ignore
    cmd.L = this.L;
    const dendronRoot = DendronWorkspace.wsRoot();
    if (_.isUndefined(dendronRoot)) {
      throw Error("dendronRoot note set");
    }
    this.L.info({ ...ctx, config });
    let errors = [];
    // @ts-ignore
    ({ errors } = await cmd.execute({
      config,
      engineClient: engine as DEngineClientV2,
      wsRoot: dendronRoot,
      writeStubs,
      incremental,
    }));
    if (!_.isEmpty(errors)) {
      return VSCodeUtils.showWebView({
        title: "Errors while publishing",
        content: [
          "The following files had links that did not resolve.",
          ...errors.map((ent) => JSON.stringify(ent)),
        ].join("\n"),
      });
    }
    window.showInformationMessage("finished");
  }
}
