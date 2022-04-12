import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { StateService } from "../services/stateService";
import { BasicCommand } from "./base";

type ConfigScope = "local" | "global" | "all";
type CommandOpts = {
  scope: ConfigScope;
};

type CommandOutput = void;

type CommandInput = {
  scope: ConfigScope;
};

const valid = ["local", "global", "all"];

export class ResetConfigCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.RESET_CONFIG.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const scope = await window.showInputBox({
      prompt: "Select scope",
      ignoreFocusOut: true,
      validateInput: (input: string) => {
        if (!_.includes(valid, input)) {
          return `input must be one of ${valid.join(", ")}`;
        }
        return undefined;
      },
      value: "all",
    });
    if (!scope) {
      return;
    }
    return { scope } as CommandInput;
  }

  async execute(opts: CommandOpts) {
    const scope = opts.scope;
    const stateService = StateService.instance();
    const wsRoot = this.extension.getDWorkspace().wsRoot;
    const wsService = new WorkspaceService({ wsRoot });
    if (scope === "all") {
      stateService.resetGlobalState();
      wsService.resetMeta();
    } else if (scope === "global") {
      stateService.resetGlobalState();
    } else if (scope === "local") {
      wsService.resetMeta();
    } else {
      throw Error(`wrong scope: ${opts}`);
    }
    window.showInformationMessage(`reset config`);
    return;
  }
}
