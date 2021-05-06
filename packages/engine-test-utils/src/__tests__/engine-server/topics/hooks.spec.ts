import { NoteUtils } from "@dendronhq/common-all";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { requireHook } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";

const jsHookPayload = `module.exports = async function({note, execa}) {
    note.body = note.body + " hello";
    return note;
};
`;
const execaHookPayload = `module.exports = async function({note, execa, _}) {
    const {stdout} = await execa('echo', ['hello']);
    note.body = note.body + " " + _.trim(stdout);
    return note;
};
`;

describe("basic", () => {
  test("use js", async () => {
    const root = FileTestUtils.tmpDir();
    const hookPath = path.join(root.name, "hook.js");
    fs.writeFileSync(hookPath, jsHookPayload);
    const note = NoteUtils.create({
      fname: "foo",
      vault: { fsPath: "foo" },
      body: "foo body",
    });
    const out = await requireHook({ fpath: hookPath, note });
    expect(out.body).toEqual("foo body hello");
  });

  test("use execa", async () => {
    const root = FileTestUtils.tmpDir();
    const hookPath = path.join(root.name, "hook.js");
    fs.writeFileSync(hookPath, execaHookPayload);
    const note = NoteUtils.create({
      fname: "foo",
      vault: { fsPath: "foo" },
      body: "foo body",
    });
    const out = await requireHook({ fpath: hookPath, note });
    expect(out.body).toEqual("foo body hello");
  });
});
