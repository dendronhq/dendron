import {
  ConfigUtils,
  DVaultVisibility,
  NoteUtils,
} from "@dendronhq/common-all";
import { note2File, tmpDir } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { MDUtilsV4, MDUtilsV5 } from "@dendronhq/engine-server";
import { runEngineTestV5, TestConfigUtils } from "../../..";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";

describe("backlinks", () => {
  let siteRootDir: string;

  beforeEach(() => {
    siteRootDir = tmpDir().name;
  });

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV5.procRehypeFull({
          engine,
          vault,
          fname: "beta",
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<a href="alpha.html">Alpha (vault1)</a>`],
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
              const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
              ConfigUtils.setVaults(
                v4DefaultConfig,
                ConfigUtils.getVaults(config)
              );
              return v4DefaultConfig;
            },
            {
              wsRoot,
            }
          );
        },
      }
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
              const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
              ConfigUtils.setSiteProp(v4DefaultConfig, "siteHierarchies", [
                "alpha",
              ]);
              ConfigUtils.setSiteProp(v4DefaultConfig, "siteNotesDir", "docs");
              ConfigUtils.setSiteProp(
                v4DefaultConfig,
                "siteUrl",
                "https://foo.com"
              );
              ConfigUtils.setSiteProp(
                v4DefaultConfig,
                "siteRootDir",
                siteRootDir
              );
              ConfigUtils.setVaults(
                v4DefaultConfig,
                ConfigUtils.getVaults(config)
              );
              return v4DefaultConfig;
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
        const resp = await MDUtilsV5.procRehypeFull({
          engine,
          vault,
          fname: "one",
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [
              `<a href="three.html">Three (vault1)</a>`,
              `<a href="two.html">Two (vault1)</a>`,
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
          TestConfigUtils.withConfig(
            (config) => {
              const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
              ConfigUtils.setVaults(
                v4DefaultConfig,
                ConfigUtils.getVaults(config)
              );
              return v4DefaultConfig;
            },
            {
              wsRoot,
            }
          );
        },
      }
    );
  });

  test("backlinks to private vaults not added", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV5.procRehypeFull({
          engine,
          vault,
          fname: "one",
        }).process("");
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            nomatch: [
              `<a href="secret1">Secret1 (vault2)</a>`,
              `<a href="secret2">Secret2 (vault2)</a>`,
            ],
            match: [`<a href="not-secret.html">Not Secret (vaultThree)</a>`],
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
              const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
              ConfigUtils.setVaults(v4DefaultConfig, vaults);
              return v4DefaultConfig;
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

  test("backlink to an invalid note doesn't cause a crash", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV5.procRehypeFull({
          engine,
          vault,
          fname: "one",
        }).process("");

        // The more important aspect of the verification is that the process()
        // call doesn't crash.
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<strong>Backlinks</strong>`],
          })
        ).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async (opts: any) => {
          await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);

          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            fname: "one",
            vault: vaults[0],
            wsRoot,
            body: "one",
          });
          await NoteTestUtilsV4.createNote({
            fname: "duplicateOne",
            vault: vaults[1],
            wsRoot,
            body: "[[one]]",
          });

          // Create a note with the same ID as the previous note to create an
          // invalid engine state, and add links to the target note from both
          // notes with the same ID:
          const note = NoteUtils.create({
            created: 1,
            updated: 1,
            id: "duplicateOne",
            fname: "duplicateTwo",
            vault: vaults[1],
            body: "[[one]]",
          });
          await note2File({ note, vault: vaults[1], wsRoot });
        },
      }
    );
  });

  describe("frontmatter tags", () => {
    test("single", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const vault = vaults[0];
          const resp = await MDUtilsV5.procRehypeFull({
            engine,
            vault,
            fname: "tags.test",
          }).process("");
          // should be one backlink
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents as string,
              match: [`<a href="one.html">One (vault1)</a>`],
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
            TestConfigUtils.withConfig(
              (config) => {
                const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
                ConfigUtils.setVaults(
                  v4DefaultConfig,
                  ConfigUtils.getVaults(config)
                );
                return v4DefaultConfig;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });

    test("multiple", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const vault = vaults[0];
          const resp = await MDUtilsV5.procRehypeFull({
            engine,
            vault,
            fname: "tags.test",
          }).process("");
          // should be one backlink
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents as string,
              match: [
                `<a href="one.html">One (vault1)</a>`,
                `<a href="two.html">Two (vault1)</a>`,
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
            TestConfigUtils.withConfig(
              (config) => {
                const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
                ConfigUtils.setVaults(
                  v4DefaultConfig,
                  ConfigUtils.getVaults(config)
                );
                return v4DefaultConfig;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });
  });
  //
  test("hashtag", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV5.procRehypeFull({
          engine,
          vault,
          fname: "tags.test",
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
