import { DEngine, DEngineClientV2 } from "@dendronhq/common-all";
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
    let engine = await new ReloadIndexCommand().execute();
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
    let errors = [];
    if (DendronWorkspace.lsp()) {
      ({ errors } = await cmd.execute({
        config,
        engine: {} as any,
        engineClient: engine as DEngineClientV2,
        wsRoot: dendronRoot,
        writeStubs,
        incremental,
      }));
    } else {
      ({ errors } = await cmd.execute({
        config,
        engine: engine as DEngine,
        wsRoot: dendronRoot,
        writeStubs,
        incremental,
      }));
    }
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
