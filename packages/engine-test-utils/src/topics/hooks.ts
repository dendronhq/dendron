import path from "path";
import fs from "fs-extra";
import { HookUtils } from "@dendronhq/engine-server";

export class TestHookUtils {
  static genJsHookPayload = (
    canary: string
  ) => `module.exports = async function({note, execa}) {
    note.body = note.body + " ${canary}";
    return note;
};
`;
  static writeJSHook = ({
    wsRoot,
    fname,
    canary,
  }: {
    wsRoot: string;
    fname: string;
    canary: string;
  }) => {
    const hookDir = HookUtils.getHookDir(wsRoot);
    const hookPath = path.join(hookDir, `${fname}.js`);
    fs.ensureFileSync(hookPath);
    fs.writeFileSync(hookPath, TestHookUtils.genJsHookPayload(canary));
  };
}
