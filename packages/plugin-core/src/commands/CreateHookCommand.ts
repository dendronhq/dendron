import { DendronError, IDendronError } from "@dendronhq/common-all";
import { HookUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { getEngine } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = { scriptName: string };

type CommandOutput = { error: IDendronError } | void;

const hookTemplate = `
/**
 @params wsRoot: string, root of your current workspace
 @params note: Object with following properties https://github.com/dendronhq/dendron/blob/dev-kevin/packages/common-all/src/typesv2.ts#L135:L153
 @params NoteUtils: utilities for working with notes. [code](https://github.com/dendronhq/dendron/blob/master/packages/common-all/src/dnode.ts#L307:L307)
 @params execa: instance of [execa](https://github.com/sindresorhus/execa#execacommandcommand-options)
 @params _: instance of [lodash](https://lodash.com/docs)
 */
module.exports = async function({note, execa, _}) {
    // do some changes
    return {note};
};

`;

export class CreateHookCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.CREATE_HOOK.key;

  async gatherInputs() {
    const scriptName = await VSCodeUtils.showInputBox({
      placeHolder: "name of hook",
    });
    if (!scriptName) {
      return undefined;
    }
    return { scriptName };
  }

  async execute({ scriptName }: CommandOpts) {
    const engine = getEngine();
    const { wsRoot } = engine;
    const scriptPath = HookUtils.getHookScriptPath({
      wsRoot,
      basename: scriptName + ".js",
    });
    fs.ensureDirSync(path.dirname(scriptPath));
    if (fs.existsSync(scriptPath)) {
      const error = DendronError.createPlainError({
        message: `${scriptPath} exists`,
      });
      this.L.error({ error });
      return { error };
    }
    fs.writeFileSync(scriptPath, hookTemplate);
    await VSCodeUtils.openFileInEditor(Uri.file(scriptPath));
    return;
  }
}
