import { BuildSiteCommand } from "@dendronhq/dendron-cli";
import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class BuildPodCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  async gatherInputs(): Promise<CommandInput | undefined> {
    const resp = await window.showInputBox({
      prompt: "Select your folder for dendron",
      ignoreFocusOut: true,
      validateInput: (input: string) => {
        if (!path.isAbsolute(input)) {
          if (input[0] !== "~") {
            return "must enter absolute path";
          }
        }
        return undefined;
      },
    });
    if (_.isUndefined(resp)) {
      return;
    }
    return;
  }

  async execute(opts: CommandOpts) {
    const ctx = { ctx: "PlantNotesCommand" };
    const {} = _.defaults(opts, {});
    const ws = DendronWorkspace.instance();
    // TODO: HACK, need to actually track changes
    const engine = await new ReloadIndexCommand().execute({
      root: ws.engine.props.root,
    });
    const config = ws.config?.site;
    if (_.isUndefined(config)) {
      throw Error("no config found");
    }
    const cmd = new BuildSiteCommand();
    cmd.L = this.L;
    const dendronRoot = DendronWorkspace.rootDir();
    if (_.isUndefined(dendronRoot)) {
      throw Error("dendronRoot note set");
    }
    this.L.info({ ...ctx, config });
    await cmd.execute({ engine, config, dendronRoot });
    window.showInformationMessage("finished");
  }
}
