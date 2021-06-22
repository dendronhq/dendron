import {
  CONSTANTS,
  DEngineClient,
  NoteOpts,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import { AssertUtils } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { TestConfigUtils } from "../../../config";
import {
  createEngineFromServer,
  runEngineTestV5,
  testWithEngine,
} from "../../../engine";
import { TestHookUtils } from "../../../topics";

const execaHookPayload = `module.exports = async function({note, execa, _}) {
    const {stdout} = await execa('echo', ['hello']);
    note.body = note.body + " " + _.trim(stdout);
    return {note};
};
`;
const { writeJSHook } = TestHookUtils;

const writeExecaHook = (root: string, fname: string) => {
  const hookPath = path.join(root, `${fname}.js`);
  fs.writeFileSync(hookPath, execaHookPayload);
};

const writeNote = async ({
  noteOpts,
  engine,
}: {
  noteOpts: NoteOpts;
  engine: DEngineClient;
}) => {
  const note = NoteUtils.create(noteOpts);
  await engine.writeNote(note, { newNode: true });
  const out = engine.notes[note.id];
  return { note: out };
};

const expectNote = async ({
  note,
  match,
  nomatch,
}: {
  note: NoteProps;
  match?: string[];
  nomatch?: string[];
}) => {
  const ok = await AssertUtils.assertInString({
    body: note.body,
    match,
    nomatch,
  });
  if (!ok) {
    console.log(note.body);
  }
  expect(ok).toBeTruthy();
};

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
        writeJSHook({ wsRoot, fname: "hello", canary: "hello" });
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
        writeJSHook({ wsRoot, fname: "hello", canary: "hello" });
        writeJSHook({ wsRoot, fname: "goodbye", canary: "goodbye" });
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

  test("custom filter rules", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = _.find(vaults, { fsPath: "vault1" })!;
        let { note } = await writeNote({
          noteOpts: {
            id: "hooked",
            fname: "hooked",
            body: "hooked body",
            vault,
          },
          engine,
        });
        await expectNote({ note, nomatch: ["hooked body hello"] });
        ({ note } = await writeNote({
          noteOpts: {
            id: "daily.journal",
            fname: "daily.journal",
            body: "daily body",
            vault,
          },
          engine,
        }));
        await expectNote({ note, match: ["daily body hello"] });
      },
      {
        expect,
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
                    pattern: "daily.*",
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

  test("suppressed hook function", async () => {
    await runEngineTestV5(
      async ({ vaults, engine }) => {
        const vault = _.find(vaults, { fsPath: "vault1" })!;
        const note = NoteUtils.create({
          id: "hooked",
          fname: "hooked",
          body: "hooked body",
          vault,
        });
        await engine.writeNote(note, { newNode: true, runHooks: false });
        const ent = engine.notes["hooked"];
        expect(
          await AssertUtils.assertInString({
            body: ent.body,
            match: ["hooked body"],
          })
        ).toBeTruthy();
      },
      {
        initHooks: true,
        expect,
        createEngine: createEngineFromServer,
        preSetupHook: async ({ wsRoot }) => {
          writeJSHook({ wsRoot, fname: "hello", canary: "hello" });
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
});

describe("remote engine", async () => {
  test("bad hook", async () => {
    await runEngineTestV5(
      async ({ initResp }) => {
        expect(
          initResp.error!.message.startsWith("hook hello has missing script")
        ).toBeTruthy();
      },
      {
        initHooks: true,
        expect,
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

  test("bad hook function", async () => {
    await runEngineTestV5(
      async ({ vaults, engine }) => {
        const vault = _.find(vaults, { fsPath: "vault1" })!;
        const note = NoteUtils.create({
          id: "hooked",
          fname: "hooked",
          body: "hooked body",
          vault,
        });
        const resp = await engine.writeNote(note, { newNode: true });
        expect(
          resp.error!.message.startsWith("NoteProps is undefined")
        ).toBeTruthy();
      },
      {
        initHooks: true,
        expect,
        createEngine: createEngineFromServer,
        preSetupHook: async ({ wsRoot }) => {
          TestHookUtils.writeJSHook({
            wsRoot,
            fname: "hello",
            hookPayload: TestHookUtils.genBadJsHookPayload(),
          });
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
});
