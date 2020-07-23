import _ from "lodash";
import { window } from "vscode";
import { GLOBAL_STATE, WORKSPACE_STATE } from "../constants";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class ResetConfigCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  async execute(_opts: CommandOpts) {
    await Promise.all(
      _.keys(GLOBAL_STATE)
        .map((k) => {
          return DendronWorkspace.instance().updateGlobalState(
            k as keyof typeof GLOBAL_STATE,
            undefined
          );
        })
        .concat(_.keys(WORKSPACE_STATE).map((k) => {
          return DendronWorkspace.instance().context.workspaceState.update(k, undefined);
        }))
    );
    window.showInformationMessage(`reset config`);
  }
}
