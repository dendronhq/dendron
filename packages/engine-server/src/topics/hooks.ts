import {
  CONSTANTS,
  DendronError,
  DHookEntry,
  NoteProps,
} from "@dendronhq/common-all";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export class HookUtils {
  static findScript({
    wsRoot,
    scriptPath,
  }: {
    scriptPath: string;
    wsRoot: string;
  }) {
    return path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE, scriptPath);
  }

  static requireHook = async ({
    note,
    fpath,
  }: {
    note: NoteProps;
    fpath: string;
  }) => {
    return await require(fpath)({ note, execa, _ });
  };

  static validateHook = ({
    hook,
    wsRoot,
  }: {
    hook: DHookEntry;
    wsRoot: string;
  }) => {
    const scriptPath = hook.id + "." + hook.type;
    const hookPath = HookUtils.findScript({ wsRoot, scriptPath });
    if (!fs.existsSync(hookPath)) {
      return {
        error: new DendronError({
          msg: `hook ${hook.id} has missing script. ${hookPath} doesn't exist`,
        }),
        valid: false,
      };
    }
    return { error: null, valid: true };
  };
}
