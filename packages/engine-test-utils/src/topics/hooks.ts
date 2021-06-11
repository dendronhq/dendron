import path from "path";
import fs from "fs-extra";
import { HookUtils } from "@dendronhq/engine-server";

export class TestHookUtils {
  static genBadJsHookPayload =
    () => `module.exports = async function({note, execa}) {
    note.body = note.body + " hello";
    return note;
};
`;
  static genJsHookPayload = (
    canary: string
  ) => `module.exports = async function({note, execa}) {
    note.body = note.body + " ${canary}";
    return {note};
};
`;
  static writeJSHook = ({
    wsRoot,
    fname,
    canary,
    hookPayload,
  }: {
    wsRoot: string;
    fname: string;
    canary?: string;
    hookPayload?: string;
  }) => {
    canary = canary || "hello";
    hookPayload = hookPayload || TestHookUtils.genJsHookPayload(canary);
    const hookDir = HookUtils.getHookDir(wsRoot);
    const hookPath = path.join(hookDir, `${fname}.js`);
    fs.ensureFileSync(hookPath);
    fs.writeFileSync(hookPath, hookPayload);
  };
}
