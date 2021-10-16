import {
  CONSTANTS,
  IntermediateDendronConfig,
  DendronError,
  DHookEntry,
  DHookType,
  ERROR_SEVERITY,
  NoteProps,
  NoteUtils,
  configIsAtLeastV3,
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import { DConfig } from "../config";
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
    config: IntermediateDendronConfig;
    hookType: DHookType;
    hookEntry: DHookEntry;
  }) {
    const hooks = DConfig.getConfig({
      config,
      path: "workspace.hooks",
    });
    const onCreate: DHookEntry[] = _.get(
      hooks,
      hookType,
      [] as DHookEntry[]
    ).concat([hookEntry]);
    if (configIsAtLeastV3({ config })) {
      config.workspace!.hooks = config.workspace!.hooks || { onCreate: [] };
      config.workspace!.hooks.onCreate = onCreate;
    } else {
      config.hooks = config.hooks || { onCreate: [] };
      config.hooks.onCreate = onCreate;
    }
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
    config: IntermediateDendronConfig;
    hookType: DHookType;
    hookId: string;
  }) {
    const hooks = DConfig.getConfig({
      config,
      path: "workspace.hooks",
    });
    let onCreate: DHookEntry[] = _.get(hooks, hookType, [] as DHookEntry[]);
    onCreate = _.remove(onCreate, { id: hookId });
    const idx = _.findIndex(onCreate, { id: hookId });
    onCreate.splice(idx, 1);

    if (configIsAtLeastV3({ config })) {
      config.workspace!.hooks = config.workspace!.hooks || { onCreate: [] };
      config.workspace!.hooks.onCreate = onCreate;
    } else {
      config.hooks = config.hooks || { onCreate: [] };
      config.hooks.onCreate = onCreate;
    }

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
