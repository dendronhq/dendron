import {
  ConfigUtils,
  CONSTANTS,
  DEngineClient,
  DHookDict,
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

const axiosHookPayload = `module.exports = async function({note, axios}) {
  // Get some axios property that's very unlikely to change
  // expected here: 'application/json'
  const contentType = axios.defaults.headers.common.Accept.split(",")[0];
  note.body = note.body + " " + contentType;
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
  await engine.writeNote(note);
  const out = (await engine.getNote(note.id)).data!;
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

describe("engine", () => {
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
      await engine.writeNote(note);
      const ent = (await engine.getNote("hooked")).data!;
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
        await TestConfigUtils.withConfig(
          (config) => {
            const hooks: DHookDict = {
              onCreate: [
                {
                  id: "hello",
                  pattern: "*",
                  type: "js",
                },
              ],
            };
            ConfigUtils.setHooks(config, hooks);
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
      await engine.writeNote(note);
      const ent = (await engine.getNote("hooked")).data!;
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
        await TestConfigUtils.withConfig(
          (config) => {
            const hooks: DHookDict = {
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
            ConfigUtils.setHooks(config, hooks);
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
      await engine.writeNote(note);
      const ent = (await engine.getNote("hooked")).data!;
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
        await TestConfigUtils.withConfig(
          (config) => {
            const hooks: DHookDict = {
              onCreate: [
                {
                  id: "hello",
                  pattern: "*",
                  type: "js",
                },
              ],
            };
            ConfigUtils.setHooks(config, hooks);
            return config;
          },
          { wsRoot }
        );
      },
    }
  );

  testWithEngine(
    "axios available",
    async ({ engine, vaults }) => {
      const vault = _.find(vaults, { fsPath: "vault1" })!;
      const note = NoteUtils.create({
        id: "hooked",
        fname: "hooked",
        body: "hooked body",
        vault,
      });
      await engine.writeNote(note);
      const ent = (await engine.getNote("hooked")).data!;
      expect(
        await AssertUtils.assertInString({
          body: ent.body,
          match: ["hooked body application/json"],
        })
      ).toBeTruthy();
    },
    {
      initHooks: true,
      preSetupHook: async ({ wsRoot }) => {
        const hookPath = path.join(
          wsRoot,
          CONSTANTS.DENDRON_HOOKS_BASE,
          "content.js"
        );
        fs.writeFileSync(hookPath, axiosHookPayload);
        await TestConfigUtils.withConfig(
          (config) => {
            const hooks: DHookDict = {
              onCreate: [
                {
                  id: "content",
                  pattern: "*",
                  type: "js",
                },
              ],
            };
            ConfigUtils.setHooks(config, hooks);
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
          await TestConfigUtils.withConfig(
            (config) => {
              const hooks: DHookDict = {
                onCreate: [
                  {
                    id: "hello",
                    pattern: "daily.*",
                    type: "js",
                  },
                ],
              };
              ConfigUtils.setHooks(config, hooks);
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
        await engine.writeNote(note, { runHooks: false });
        const ent = (await engine.getNote("hooked")).data!;
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
          await TestConfigUtils.withConfig(
            (config) => {
              const hooks: DHookDict = {
                onCreate: [
                  {
                    id: "hello",
                    pattern: "*",
                    type: "js",
                  },
                ],
              };
              ConfigUtils.setHooks(config, hooks);
              return config;
            },
            { wsRoot }
          );
        },
      }
    );
  });
});

describe("remote engine", () => {
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
          await TestConfigUtils.withConfig(
            (config) => {
              const hooks: DHookDict = {
                onCreate: [
                  {
                    id: "hello",
                    pattern: "*",
                    type: "js",
                  },
                ],
              };
              ConfigUtils.setHooks(config, hooks);
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
        const resp = await engine.writeNote(note);
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
          await TestConfigUtils.withConfig(
            (config) => {
              const hooks: DHookDict = {
                onCreate: [
                  {
                    id: "hello",
                    pattern: "*",
                    type: "js",
                  },
                ],
              };
              ConfigUtils.setHooks(config, hooks);
              return config;
            },
            { wsRoot }
          );
        },
      }
    );
  });
});
