import {
  CONSTANTS,
  DendronConfig,
  DendronError,
  DHookEntry,
  DHookType,
  ERROR_SEVERITY,
  NoteProps,
  NoteUtils,
  ConfigUtils,
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import axios from "axios";
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
    const hooks = ConfigUtils.getHooks(config);
    const onCreate: DHookEntry[] = _.get(
      hooks,
      hookType,
      [] as DHookEntry[]
    ).concat([hookEntry]);
    const hooksToAdd = hooks || { onCreate: [] };
    hooksToAdd.onCreate = onCreate;
    ConfigUtils.setHooks(config, hooksToAdd);
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

  static removeFromConfig({
    config,
    hookType,
    hookId,
  }: {
    config: DendronConfig;
    hookType: DHookType;
    hookId: string;
  }) {
    const hooks = ConfigUtils.getHooks(config);
    let onCreate: DHookEntry[] = _.get(hooks, hookType, [] as DHookEntry[]);
    onCreate = _.remove(onCreate, { id: hookId });
    const idx = _.findIndex(onCreate, { id: hookId });
    onCreate.splice(idx, 1);
    const hooksAfterRemove = hooks || { onCreate: [] };
    hooksAfterRemove.onCreate = onCreate;
    ConfigUtils.setHooks(config, hooksAfterRemove);

    return config;
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
    const logger = createLogger();
    logger.info({ ctx: "requireHook", msg: "using webpack require" });
    const req = require(`./webpack-require-hack.js`);
    logger.info({ ctx: "requireHook", fpath, wsRoot });
    return await req(fpath)({
      wsRoot,
      note: { ...note },
      execa,
      axios,
      _,
      NoteUtils,
    });
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
