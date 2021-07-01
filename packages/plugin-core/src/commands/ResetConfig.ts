import _ from "lodash";
import { window } from "vscode";
import { DENDRON_COMMANDS, GLOBAL_STATE, WORKSPACE_STATE } from "../constants";
import { DendronWorkspace } from "../workspace";
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
  static key = DENDRON_COMMANDS.RESET_CONFIG.key;
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

  async resetWorkspaceState() {
    return Promise.all(
      _.keys(WORKSPACE_STATE).map((k) => {
        return DendronWorkspace.instance().context.workspaceState.update(
          // @ts-ignore
          WORKSPACE_STATE[k],
          undefined
        );
      })
    );
  }

  async resetGlobalState() {
    return Promise.all(
      _.values(GLOBAL_STATE).map((k) => {
        return DendronWorkspace.instance().updateGlobalState(
          k,
          undefined
        );
      })
    );
  }

  async execute(opts: CommandOpts) {
    const scope = opts.scope;
    if (scope === "all") {
      await this.resetGlobalState();
      await this.resetWorkspaceState();
    } else if (scope === "global") {
      await this.resetGlobalState();
    } else if (scope === "local") {
      await this.resetWorkspaceState();
    } else {
      throw Error(`wrong scope: ${opts}`);
    }
    window.showInformationMessage(`reset config`);
    return;
  }
}
