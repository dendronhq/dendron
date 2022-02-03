import {
  ConfigUtils,
  DEngineClient,
  DVaultVisibility,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";
import {
  DendronASTData,
  DendronASTDest,
  DendronPubOpts,
  MDUtilsV4,
} from "@dendronhq/engine-server";
import { TestConfigUtils, runEngineTestV5 } from "../../..";

// runs all the processes
function proc(
  engine: DEngineClient,
  dendron: DendronASTData,
  opts?: DendronPubOpts
) {
  return MDUtilsV4.procFull({
    engine,
    ...dendron,
    publishOpts: opts,
  });
}

describe("backlinks", () => {
  const dest = DendronASTDest.HTML;
  let siteRootDir: string;

  beforeEach(() => {
    siteRootDir = tmpDir().name;
  });

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(engine, {
            fname: "beta",
            vault,
            dest,
            config: engine.config,
          }),
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<a href="alpha">Alpha (vault1)</a>`],
          })
        ).toBeTruthy();
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupLinks }
    );
  });

  test("backlink to home page", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const alphaNote = engine.notes["alpha"];
        const resp = await MDUtilsV4.procHTML({
          config: engine.config,
          engine,
          fname: "beta",
          vault: vaults[0],
          noteIndex: alphaNote,
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<a href="https://foo.com">Alpha (vault1)</a>`],
          })
        ).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async (opts) => {
          const { wsRoot } = opts;
          await ENGINE_HOOKS.setupLinks(opts);
          TestConfigUtils.withConfig(
            (config) => {
              // TODO: remove version overwrite after config.site is completely deprecated
              config.version = 4;
              config.site = {
                siteHierarchies: ["alpha"],
                siteNotesDir: "docs",
                siteUrl: "https://foo.com",
                siteRootDir,
              };
              return config;
            },
            {
              wsRoot,
            }
          );
        },
      }
    );
  });

  test("multiple links", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(engine, {
            fname: "one",
            vault,
            dest,
            config: engine.config,
          }),
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [
              `<a href="three">Three (vault1)</a>`,
              `<a href="two">Two (vault1)</a>`,
            ],
          })
        ).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            fname: "one",
            vault,
            wsRoot,
            body: "One body",
          });
          await NoteTestUtilsV4.createNote({
            fname: "two",
            vault,
            wsRoot,
            body: "[[one]]",
          });
          await NoteTestUtilsV4.createNote({
            fname: "three",
            vault,
            wsRoot,
            body: "[[one]]",
          });
        },
      }
    );
  });

  test("backlinks to private vaults not added", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(engine, {
            fname: "one",
            vault,
            dest,
            config: engine.config,
          }),
        }).process("");
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            nomatch: [
              `<a href="secret1">Secret1 (vault2)</a>`,
              `<a href="secret2">Secret2 (vault2)</a>`,
            ],
            match: [`<a href="not-secret">Not Secret (vaultThree)</a>`],
          })
        ).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async (opts: any) => {
          await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
          TestConfigUtils.withConfig(
            (config) => {
              const vaults = ConfigUtils.getVaults(config);
              const bvault = vaults.find((ent: any) => ent.fsPath === "vault2");
              bvault!.visibility = DVaultVisibility.PRIVATE;
              return config;
            },
            { wsRoot: opts.wsRoot }
          );

          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            fname: "one",
            vault: vaults[0],
            wsRoot,
            body: "one",
          });
          await NoteTestUtilsV4.createNote({
            fname: "secret1",
            vault: vaults[1],
            wsRoot,
            body: "[[one]]",
          });
          await NoteTestUtilsV4.createNote({
            fname: "secret2",
            vault: vaults[1],
            wsRoot,
            body: "[[one]]",
          });
          await NoteTestUtilsV4.createNote({
            fname: "not-secret",
            vault: vaults[2],
            wsRoot,
            body: "[[one]]",
          });
        },
      }
    );
  });

  describe("frontmatter tags", () => {
    test("single", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const vault = vaults[0];
          const resp = await MDUtilsV4.procRehype({
            proc: proc(engine, {
              fname: "tags.test",
              vault,
              dest,
              config: engine.config,
            }),
          }).process("");
          // should be one backlink
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents as string,
              match: [`<a href="one">One (vault1)</a>`],
            })
          ).toBeTruthy();
        },
        {
          expect,
          preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            const vault = vaults[0];
            await NoteTestUtilsV4.createNote({
              fname: "one",
              vault,
              wsRoot,
              props: {
                tags: "test",
              },
            });
            await NoteTestUtilsV4.createNote({
              fname: "tags.test",
              vault,
              wsRoot,
            });
          },
        }
      );
    });

    test("multiple", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const vault = vaults[0];
          const resp = await MDUtilsV4.procRehype({
            proc: proc(engine, {
              fname: "tags.test",
              vault,
              dest,
              config: engine.config,
            }),
          }).process("");
          // should be one backlink
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents as string,
              match: [
                `<a href="one">One (vault1)</a>`,
                `<a href="two">Two (vault1)</a>`,
              ],
            })
          ).toBeTruthy();
        },
        {
          expect,
          preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            const vault = vaults[0];
            await NoteTestUtilsV4.createNote({
              fname: "one",
              vault,
              wsRoot,
              props: {
                tags: ["test", "other"],
              },
            });
            await NoteTestUtilsV4.createNote({
              fname: "two",
              vault,
              wsRoot,
              props: {
                tags: "test",
              },
            });
            await NoteTestUtilsV4.createNote({
              fname: "tags.test",
              vault,
              wsRoot,
            });
          },
        }
      );
    });
  });

  test("hashtag", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(engine, {
            fname: "tags.test",
            vault,
            dest,
            config: engine.config,
          }),
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<a href="one">One (vault1)</a>`],
          })
        ).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            fname: "one",
            vault,
            wsRoot,
            body: "#test",
          });
          await NoteTestUtilsV4.createNote({
            fname: "tags.test",
            vault,
            wsRoot,
          });
        },
      }
    );
  });
});
