import { DHookType, IDendronError } from "@dendronhq/common-all";
import { DConfig, HookUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { getEngine } from "../workspace";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type CommandOpts = { hookName: string; shouldDeleteScript: boolean };

type CommandOutput = { error: IDendronError } | void;

export class DeleteHookCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.DELETE_HOOK.key;

  async gatherInputs() {
    const hookName = await VSCodeUtils.showInputBox({
      placeHolder: "name of hook",
    });
    if (!hookName) {
      return undefined;
    }
    const shouldDeleteScript = await VSCodeUtils.showQuickPick(["yes", "no"], {
      placeHolder: "delete the script",
    });
    if (!shouldDeleteScript) {
      return undefined;
    }
    return { hookName, shouldDeleteScript: shouldDeleteScript === "yes" };
  }

  async execute({ hookName, shouldDeleteScript }: CommandOpts) {
    const engine = getEngine();
    const { wsRoot } = engine;
    const scriptPath = HookUtils.getHookScriptPath({
      wsRoot,
      basename: hookName + ".js",
    });
    if (shouldDeleteScript) {
      fs.removeSync(scriptPath);
    }

    const config = HookUtils.removeFromConfig({
      config: engine.config,
      hookId: hookName,
      hookType: DHookType.onCreate,
    });
    DConfig.writeConfig({ wsRoot, config });
    window.showInformationMessage(`hook ${hookName} removed`);
    await new ReloadIndexCommand().run();
    return;
  }
}
