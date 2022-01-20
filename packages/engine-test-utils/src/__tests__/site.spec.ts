import {
  DendronSiteConfig,
  DendronSiteFM,
  DuplicateNoteActionEnum,
  DVault,
  DVaultVisibility,
  NotePropsDict,
  NoteProps,
  NoteUtils,
  WorkspaceOpts,
  ConfigUtils,
} from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  NoteTestUtilsV4,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import { MDUtilsV4, SiteUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { TestConfigUtils } from "../config";
import {
  createEngineFromEngine,
  createEngineFromServer,
  createSiteConfig,
  runEngineTestV5,
  testWithEngine,
} from "../engine";
import {
  callSetupHook,
  ENGINE_HOOKS,
  ENGINE_HOOKS_MULTI,
  SETUP_HOOK_KEYS,
} from "../presets";
import { checkString, TestUnifiedUtils } from "../utils";

const basicSetup = (preSetupHook?: SetupHookFunction) => ({
  createEngine: createEngineFromEngine,
  expect,
  preSetupHook: async (opts: WorkspaceOpts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    if (preSetupHook) {
      await preSetupHook(opts);
    }
  },
});

const dupNote = (payload: DVault | string[]) => {
  const out: any = {
    duplicateNoteBehavior: {
      action: DuplicateNoteActionEnum.useVault,
    },
  };
  if (_.isArray(payload)) {
    out.duplicateNoteBehavior.payload = payload;
  } else {
    out.duplicateNoteBehavior.payload = {
      vault: payload,
    };
  }
  return out;
};

const checkNotes = (opts: {
  filteredNotes: NotePropsDict;
  engineNotes: NotePropsDict;
  match: ({
    id: string;
  } & Partial<NoteProps>)[];
  noMatch?: {
    id: string;
  }[];
}) => {
  const { noMatch, filteredNotes, engineNotes } = opts;
  const notesActual = _.sortBy(_.values(opts.filteredNotes), "id");
  const notesExpected = _.map(opts.match, (opts) => {
    let note = { ...engineNotes[opts.id] };
    note = { ...note, ...opts };
    return note;
  });
  expect(notesActual).toEqual(_.sortBy(notesExpected, "id"));
  if (noMatch) {
    expect(
      _.every(noMatch, ({ id }) => {
        return !_.has(filteredNotes, id);
      })
    ).toBeTruthy();
  }
};

describe("SiteUtils", () => {
  let siteRootDir: string;

  beforeEach(() => {
    siteRootDir = tmpDir().name;
  });

  describe("xvault links", () => {
    testWithEngine(
      "can publish all",
      async ({ engine, wsRoot, vaults }) => {
        const noteIndex = engine.notes["alpha"];
        const config = TestConfigUtils.withConfig(
          (config) => {
            config.site = createSiteConfig({
              siteHierarchies: ["alpha", "beta"],
              siteRootDir,
              siteNotesDir: "docs",
              ...dupNote(vaults[1]),
            });
            return config;
          },
          {
            wsRoot,
          }
        );
        const { notes } = await SiteUtils.filterByConfig({
          engine,
          config,
        });
        const alpha = notes["alpha"];
        const beta = notes["beta"];
        const resp = await MDUtilsV4.procHTML({
          config,
          engine,
          fname: "alpha",
          vault: vaults[0],
          noteIndex,
        }).process(alpha.body);
        await checkString(
          resp.contents as string,
          "https://localhost:8080/docs/beta.html"
        );
        const resp2 = await MDUtilsV4.procHTML({
          config,
          engine,
          fname: "beta",
          vault: vaults[0],
          noteIndex,
        }).process(beta.body);
        await checkString(resp2.contents as string, "https://localhost:8080");
      },
      {
        preSetupHook: (opts) =>
          callSetupHook(SETUP_HOOK_KEYS.WITH_LINKS, {
            workspaceType: "multi",
            ...opts,
            withVaultPrefix: true,
          }),
      }
    );

    testWithEngine(
      "can publish alpha",
      async ({ engine, wsRoot, vaults }) => {
        const noteIndex = engine.notes["alpha"];
        const config = TestConfigUtils.withConfig(
          (config) => {
            config.site = createSiteConfig({
              siteHierarchies: ["alpha"],
              siteRootDir,
              ...dupNote(vaults[1]),
            });
            return config;
          },
          {
            wsRoot,
          }
        );
        const { notes } = await SiteUtils.filterByConfig({
          engine,
          config,
        });
        const alpha = notes["alpha"];
        expect(_.values(notes)).toEqual([alpha]);
        const resp = await MDUtilsV4.procHTML({
          config,
          engine,
          fname: "alpha",
          vault: vaults[0],
          noteIndex,
        }).process(alpha.body);
        // beta not published
        await TestUnifiedUtils.verifyPrivateLink({
          contents: resp.contents as string,
          value: "Beta",
        });
      },
      {
        preSetupHook: (opts) =>
          callSetupHook(SETUP_HOOK_KEYS.WITH_LINKS, {
            workspaceType: "multi",
            ...opts,
            withVaultPrefix: true,
          }),
      }
    );
  });

  describe("gen", () => {
    test("write stub", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["foo", "foobar"],
                siteRootDir,
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes, domains } = await SiteUtils.filterByConfig({
            engine,
            config,
          });
          expect(domains.length).toEqual(2);
          expect(_.size(notes)).toEqual(4);
          const vpath = vault2Path({ wsRoot, vault: vaults[0] });
          const vaultNotes = fs.readdirSync(vpath, { encoding: "utf8" });
          expect(
            await AssertUtils.assertInString({
              body: vaultNotes.join(" "),
              match: ["foobar.md"],
            })
          ).toBeTruthy();
        },
        {
          ...basicSetup(async (opts) => {
            const wsRoot = opts.wsRoot;
            const vault = opts.vaults[0];
            await NoteTestUtilsV4.createNote({
              fname: "foobar.ch1",
              vault,
              wsRoot,
            });
          }),
        }
      );
    });

    test("no write stub", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["foo", "foobar"],
                siteRootDir,
                writeStubs: false,
              });
              return config;
            },
            {
              wsRoot,
            }
          );

          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          expect(_.size(notes)).toEqual(4);
          const vpath = vault2Path({ wsRoot, vault: vaults[0] });
          const vaultNotes = fs.readdirSync(vpath, { encoding: "utf8" });
          expect(
            await AssertUtils.assertInString({
              body: vaultNotes.join(" "),
              nomatch: ["foobar.md"],
            })
          ).toBeTruthy();
        },
        {
          ...basicSetup(async (opts) => {
            const wsRoot = opts.wsRoot;
            const vault = opts.vaults[0];
            await NoteTestUtilsV4.createNote({
              fname: "foobar.ch1",
              vault,
              wsRoot,
            });
          }),
        }
      );
    });
  });

  describe("per note config", () => {
    test("blacklist note", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["foo"],
                siteRootDir,
                usePrettyRefs: true,
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          expect(_.size(notes)).toEqual(1);
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [{ id: "foo", parent: null, children: [] }],
            noMatch: [{ id: "foo.ch1" }],
          });
          expect(notes["foo"].children).toEqual([]);
        },
        {
          ...basicSetup(async (opts) => {
            const wsRoot = opts.wsRoot;
            const vault = opts.vaults[0];
            return NoteTestUtilsV4.modifyNoteByPath(
              { fname: "foo.ch1", wsRoot, vault },
              (note) => {
                note.custom = { published: false };
                return note;
              }
            );
          }),
        }
      );
    });

    test("nav_exclude", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["foo"],
                siteRootDir,
                usePrettyRefs: true,
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          expect(_.size(notes)).toEqual(2);
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [{ id: "foo", parent: null }, { id: "foo.ch1" }],
          });
        },
        {
          ...basicSetup(async (opts) => {
            const wsRoot = opts.wsRoot;
            const vault = opts.vaults[0];
            return NoteTestUtilsV4.modifyNoteByPath(
              { fname: "foo.ch1", wsRoot, vault },
              (note) => {
                note.custom = { nav_exclude: true };
                return note;
              }
            );
          }),
        }
      );
    });
  });

  describe("per hierarchy config", () => {
    let siteRootDir: string;

    beforeEach(() => {
      siteRootDir = tmpDir().name;
    });

    test("root, publish all with dup", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["root"],
                siteRootDir,
                ...dupNote(vaults[0]),
                config: {
                  root: {
                    publishByDefault: true,
                  },
                },
              });
              return config;
            },
            {
              wsRoot,
            }
          );

          const { notes, domains } = await SiteUtils.filterByConfig({
            engine,
            config,
          });
          const root = NoteUtils.getNoteByFnameV5({
            fname: "root",
            notes: engine.notes,
            vault: vaults[0],
            wsRoot: engine.wsRoot,
          });
          expect(domains.length).toEqual(3);
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [
              { id: root!.id },
              { id: "foo" },
              { id: "bar" },
              { id: "foo.ch1" },
            ],
          });
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
          },
        }
      );
    });

    test("root, publish none with dup", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["root"],
                siteRootDir,
                ...dupNote(vaults[0]),
                config: {
                  root: {
                    publishByDefault: false,
                  },
                },
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [],
          });
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
          },
        }
      );
    });

    test("one hiearchy", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["foo"],
                siteRootDir,
                usePrettyRefs: true,
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes, domains } = await SiteUtils.filterByConfig({
            engine,
            config,
          });
          expect(_.size(domains)).toEqual(2);
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [{ id: "foo", parent: null }, { id: "foo.ch1" }],
          });
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });

    // TODO
    test.skip("one hiearchy, dups with list override", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["foo"],
                siteRootDir,
                ...dupNote(["vault2", "fooVault", "vault3"]),
                config: {
                  root: {
                    publishByDefault: true,
                  },
                },
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes, domains } = await SiteUtils.filterByConfig({
            engine,
            config,
          });
          expect(domains.length).toEqual(2);
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [{ id: "foo-other", parent: null }, { id: "foo.ch1" }],
          });
        },
        {
          createEngine: createEngineFromServer,
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              vault: opts.vaults[2],
              wsRoot: opts.wsRoot,
              props: { id: "foo-other" },
            });
          },
          vaults: [
            { fsPath: "vault1" },
            { fsPath: "vault2" },
            { fsPath: "vault3", name: "fooVault" },
          ],
        }
      );
    });

    test("mult hiearchy", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["foo", "bar"],
                siteRootDir,
                usePrettyRefs: true,
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [
              { id: "foo", parent: null },
              { id: "foo.ch1" },
              { id: "bar", parent: null },
            ],
          });
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });

    // TODO: fix
    test.skip("mult hiearchy, diff publishByDefault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["foo", "bar"],
                siteRootDir,
                ...dupNote(vaults[0]),
                config: {
                  foo: {
                    publishByDefault: {
                      vault1: true,
                      vault2: false,
                    },
                  },
                },
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [
              { id: "foo", parent: null },
              { id: "foo.ch1" },
              { id: "bar", parent: null },
            ],
          });
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
            await NoteTestUtilsV4.createNote({
              fname: "foo.ch2",
              vault: opts.vaults[1],
              wsRoot: opts.wsRoot,
            });
          },
        }
      );
    });

    test("skip levels", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const config = TestConfigUtils.withConfig(
            (config) => {
              config.site = createSiteConfig({
                siteHierarchies: ["daily"],
                siteRootDir,
              });
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          expect(_.values(notes).map((ent) => ent.fname)).toEqual([
            "daily",
            "daily.journal",
            "daily.journal.2020.07.05.two",
            "daily.journal.2020.07.01.one",
          ]);
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupJournals(opts);
            const { wsRoot, vaults } = opts;
            const vault = vaults[0];
            await NoteTestUtilsV4.modifyNoteByPath(
              { wsRoot, vault, fname: "daily.journal" },
              (note) => {
                (note.custom as DendronSiteFM).skipLevels = 3;
                return note;
              }
            );
            console.log(wsRoot, vault);
          },
        }
      );
    });
  });

  describe("per vault config", () => {
    let siteRootDir: string;
    beforeEach(() => {
      siteRootDir = tmpDir().name;
    });

    test("blacklist vault", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const { notes, domains } = await SiteUtils.filterByConfig({
            engine,
            config: engine.config,
          });
          const root = NoteUtils.getNoteByFnameV5({
            fname: "root",
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });
          expect(domains.length).toEqual(2);
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [
              { id: root!.id, children: ["foo"] },
              { id: "foo" },
              { id: "foo.ch1" },
            ],
          });
        },
        {
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
            TestConfigUtils.withConfig(
              (config) => {
                const vaults = ConfigUtils.getVaults(config);
                const bvault = vaults.find((ent) => ent.fsPath === "vault2");
                bvault!.visibility = DVaultVisibility.PRIVATE;
                const sconfig: DendronSiteConfig = {
                  siteHierarchies: ["root"],
                  siteRootDir,
                  ...dupNote(opts.vaults[0]),
                  config: {
                    root: {
                      publishByDefault: true,
                    },
                  },
                };
                config.site = createSiteConfig(sconfig);
                return config;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });
  });
});
