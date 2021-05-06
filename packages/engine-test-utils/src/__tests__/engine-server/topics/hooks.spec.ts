import { CONSTANTS, NoteUtils } from "@dendronhq/common-all";
import { AssertUtils, FileTestUtils } from "@dendronhq/common-test-utils";
import { HookUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { TestConfigUtils } from "../../../config";
import { createEngineFromServer, testWithEngine } from "../../../engine";

const { requireHook } = HookUtils;

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

const genJsHookPayload = (
  canary: string
) => `module.exports = async function({note, execa}) {
    note.body = note.body + " ${canary}";
    return note;
};
`;

const writeJSHook = (root: string, fname: string, canary = "hello") => {
  const hookPath = path.join(root, `${fname}.js`);
  fs.writeFileSync(hookPath, genJsHookPayload(canary));
};

const writeExecaHook = (root: string, fname: string) => {
  const hookPath = path.join(root, `${fname}.js`);
  fs.writeFileSync(hookPath, execaHookPayload);
};

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

describe("engine", async () => {
  testWithEngine(
    "use js ",
    async ({ engine, vaults }) => {
      const vault = _.find(vaults, { fsPath: "vault1" })!;
      const note = NoteUtils.create({
        id: "hooked",
        fname: "hooked",
        body: "hooked body",
        vault,
      });
      await engine.writeNote(note, { newNode: true });
      const ent = engine.notes["hooked"];
      expect(
        await AssertUtils.assertInString({
          body: ent.body,
          match: ["hooked body hello"],
        })
      ).toBeTruthy();
    },
    {
      initHooks: true,
      preSetupHook: async ({ wsRoot }) => {
        writeJSHook(path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE), "hello");
        TestConfigUtils.withConfig(
          (config) => {
            config.hooks = {
              onCreate: [
                {
                  id: "hello",
                  pattern: "*",
                  type: "js",
                },
              ],
            };
            return config;
          },
          { wsRoot }
        );
      },
    }
  );

  testWithEngine(
    "use js 2x",
    async ({ engine, vaults }) => {
      const vault = _.find(vaults, { fsPath: "vault1" })!;
      const note = NoteUtils.create({
        id: "hooked",
        fname: "hooked",
        body: "hooked body",
        vault,
      });
      await engine.writeNote(note, { newNode: true });
      const ent = engine.notes["hooked"];
      expect(
        await AssertUtils.assertInString({
          body: ent.body,
          match: ["hooked body hello goodbye"],
        })
      ).toBeTruthy();
    },
    {
      initHooks: true,
      preSetupHook: async ({ wsRoot }) => {
        writeJSHook(path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE), "hello");
        writeJSHook(
          path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE),
          "goodbye",
          "goodbye"
        );
        TestConfigUtils.withConfig(
          (config) => {
            config.hooks = {
              onCreate: [
                {
                  id: "hello",
                  pattern: "*",
                  type: "js",
                },
                {
                  id: "goodbye",
                  pattern: "*",
                  type: "js",
                },
              ],
            };
            return config;
          },
          { wsRoot }
        );
      },
    }
  );

  testWithEngine(
    "use execa ",
    async ({ engine, vaults }) => {
      const vault = _.find(vaults, { fsPath: "vault1" })!;
      const note = NoteUtils.create({
        id: "hooked",
        fname: "hooked",
        body: "hooked body",
        vault,
      });
      await engine.writeNote(note, { newNode: true });
      const ent = engine.notes["hooked"];
      expect(
        await AssertUtils.assertInString({
          body: ent.body,
          match: ["hooked body hello"],
        })
      ).toBeTruthy();
    },
    {
      initHooks: true,
      preSetupHook: async ({ wsRoot }) => {
        writeExecaHook(
          path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE),
          "hello"
        );
        TestConfigUtils.withConfig(
          (config) => {
            config.hooks = {
              onCreate: [
                {
                  id: "hello",
                  pattern: "*",
                  type: "js",
                },
              ],
            };
            return config;
          },
          { wsRoot }
        );
      },
    }
  );
});

describe("remote engine", async () => {
  testWithEngine(
    "bad hook",
    async ({ initResp }) => {
      expect(
        initResp.error!.payload![0].msg.startsWith(
          "hook hello has missing script"
        )
      ).toBeTruthy();
    },
    {
      initHooks: true,
      createEngine: createEngineFromServer,
      preSetupHook: async ({ wsRoot }) => {
        TestConfigUtils.withConfig(
          (config) => {
            config.hooks = {
              onCreate: [
                {
                  id: "hello",
                  pattern: "*",
                  type: "js",
                },
              ],
            };
            return config;
          },
          { wsRoot }
        );
      },
    }
  );
});
