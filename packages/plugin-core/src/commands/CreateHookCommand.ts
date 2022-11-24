import {
  ConfigService,
  DendronError,
  DHookType,
  IDendronError,
  URI,
} from "@dendronhq/common-all";
import { HookUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = { hookName: string; hookFilter: string };

type CommandOutput = { error: IDendronError } | void;

const hookTemplate = `
/**
 @params wsRoot: string, root of your current workspace
 @params note: Object with following properties https://github.com/dendronhq/dendron/blob/master/packages/common-all/src/types/foundation.ts#L66:L66
 @params NoteUtils: utilities for working with notes. [code](https://github.com/dendronhq/dendron/blob/master/packages/common-all/src/dnode.ts#L323:L323)
 @params execa: instance of [execa](https://github.com/sindresorhus/execa#execacommandcommand-options)
 @params axios: instance of [axios](https://axios-http.com/docs/example)
 @params _: instance of [lodash](https://lodash.com/docs)
 */
module.exports = async function({wsRoot, note, NoteUtils, execa, axios, _}) {
    // do some changes
    return {note};
};
`;

export class CreateHookCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_HOOK.key;

  async gatherInputs() {
    const hookName = await VSCodeUtils.showInputBox({
      placeHolder: "name of hook",
    });
    if (!hookName) {
      return undefined;
    }
    const hookFilter = await VSCodeUtils.showInputBox({
      placeHolder: "filter for hook",
      value: "*",
    });
    if (!hookFilter) {
      return undefined;
    }
    return { hookName, hookFilter };
  }

  async execute({ hookName, hookFilter }: CommandOpts) {
    const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
    const scriptPath = HookUtils.getHookScriptPath({
      wsRoot,
      basename: hookName + ".js",
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

    const configService = ConfigService.instance();
    const configReadResult = await configService.readConfig(URI.file(wsRoot));
    if (configReadResult.isErr()) {
      const error = configReadResult.error;
      this.L.error(error);
      return { error };
    }
    const config = configReadResult.value;
    const configWritePayload = HookUtils.addToConfig({
      config,
      hookEntry: {
        id: hookName,
        pattern: hookFilter,
        type: "js",
      },
      hookType: DHookType.onCreate,
    });
    const configWriteResult = await configService.writeConfig(
      URI.file(wsRoot),
      configWritePayload
    );
    if (configWriteResult.isErr()) {
      const error = configWriteResult.error;
      this.L.error(error);
      return { error };
    }

    await VSCodeUtils.openFileInEditor(Uri.file(scriptPath));
    return;
  }
}
