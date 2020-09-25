import { BuildSiteCommand } from "@dendronhq/dendron-cli";
import _ from "lodash";
import { window } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type CommandOpts = {};

type CommandOutput = void;

export class BuildPodCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async execute(opts: CommandOpts) {
    const ctx = { ctx: "PlantNotesCommand" };
    const { writeStubs, incremental } = _.defaults(opts, {
      writeStubs: false,
      incremental: false,
    });
    const ws = DendronWorkspace.instance();
    // TODO: HACK, need to actually track changes
    const engine = await new ReloadIndexCommand().execute();
    const config = ws.config?.site;
    if (_.isUndefined(config)) {
      throw Error("no config found");
    }
    const cmd = new BuildSiteCommand();
    // @ts-ignore
    cmd.L = this.L;
    const dendronRoot = DendronWorkspace.rootDir();
    if (_.isUndefined(dendronRoot)) {
      throw Error("dendronRoot note set");
    }
    this.L.info({ ...ctx, config });
    const { errors } = await cmd.execute({
      engine,
      config,
      wsRoot: dendronRoot,
      writeStubs,
      incremental,
    });
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
