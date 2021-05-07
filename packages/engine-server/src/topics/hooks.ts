import {
  CONSTANTS,
  DendronConfig,
  DendronError,
  DHookEntry,
  DHookType,
  ERROR_SEVERITY,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export type RequireHookResp = {
  note: NoteProps;
  payload?: any;
};

export class HookUtils {
  static addToConfig({
    config,
    hookType,
    hookEntry,
  }: {
    config: DendronConfig;
    hookType: DHookType;
    hookEntry: DHookEntry;
  }) {
    let onCreate: DHookEntry[] = _.get(
      config.hooks,
      hookType,
      [] as DHookEntry[]
    ).concat([hookEntry]);
    config.hooks = config.hooks || { onCreate: [] };
    config.hooks.onCreate = onCreate;
    return config;
  }
  static getHookDir(wsRoot: string) {
    return path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE);
  }

  static getHookScriptPath({
    wsRoot,
    basename,
  }: {
    basename: string;
    wsRoot: string;
  }) {
    return path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE, basename);
  }

  static requireHook = async ({
    note,
    fpath,
    wsRoot,
  }: {
    note: NoteProps;
    fpath: string;
    wsRoot: string;
  }): Promise<RequireHookResp> => {
    return await require(fpath)({ wsRoot, note, execa, _, NoteUtils });
  };

  static validateHook = ({
    hook,
    wsRoot,
  }: {
    hook: DHookEntry;
    wsRoot: string;
  }) => {
    const scriptPath = hook.id + "." + hook.type;
    const hookPath = HookUtils.getHookScriptPath({
      wsRoot,
      basename: scriptPath,
    });
    if (!fs.existsSync(hookPath)) {
      return {
        error: new DendronError({
          severity: ERROR_SEVERITY.MINOR,
          message: `hook ${hook.id} has missing script. ${hookPath} doesn't exist`,
        }),
        valid: false,
      };
    }
    return { error: null, valid: true };
  };
}
