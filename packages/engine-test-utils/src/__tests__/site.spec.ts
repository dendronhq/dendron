import {
  DendronSiteConfig,
  DendronSiteFM,
  DVaultVisibility,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  ENGINE_HOOKS,
  ENGINE_HOOKS_MULTI,
  NoteTestUtilsV4,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import { createEngine, SiteUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { ConfigUtils } from "../config";
import { runEngineTestV5 } from "../engine";

const basicSetup = (preSetupHook?: SetupHookFunction) => ({
  createEngine,
  expect,
  preSetupHook: async (opts: WorkspaceOpts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    if (preSetupHook) {
      await preSetupHook(opts);
    }
  },
});

const checkNotes = (opts: {
  filteredNotes: NotePropsDictV2;
  engineNotes: NotePropsDictV2;
  match: ({
    id: string;
  } & Partial<NotePropsV2>)[];
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

  describe("gen", () => {
    test("write stub", async () => {
      await runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["foo", "foobar"],
                siteRootDir,
              };
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
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["foo", "foobar"],
                siteRootDir,
                writeStubs: false,
              };
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
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["foo"],
                siteRootDir,
                usePrettyRefs: true,
              };
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          expect(notes).toMatchSnapshot();
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
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["foo"],
                siteRootDir,
                usePrettyRefs: true,
              };
              return config;
            },
            {
              wsRoot,
            }
          );
          const { notes } = await SiteUtils.filterByConfig({ engine, config });
          expect(notes).toMatchSnapshot();
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
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["root"],
                siteRootDir,
                usePrettyRefs: true,
                duplicateNoteBehavior: {
                  action: "useVault",
                  payload: {
                    vault: vaults[0],
                  },
                },
                config: {
                  root: {
                    publishByDefault: true,
                  },
                },
              };
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
          const root = NoteUtilsV2.getNoteByFnameV4({
            fname: "root",
            notes: engine.notes,
            vault: vaults[0],
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
          createEngine,
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
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["root"],
                siteRootDir,
                usePrettyRefs: true,
                duplicateNoteBehavior: {
                  action: "useVault",
                  payload: {
                    vault: vaults[0],
                  },
                },
                config: {
                  root: {
                    publishByDefault: false,
                  },
                },
              };
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
          createEngine,
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
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["foo"],
                siteRootDir,
                usePrettyRefs: true,
              };
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
            match: [{ id: "foo", parent: null }, { id: "foo.ch1" }],
          });
        },
        {
          createEngine,
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });

    test("mult hiearchy", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["foo", "bar"],
                siteRootDir,
                usePrettyRefs: true,
              };
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
          createEngine,
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });

    test("skip levels", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const config = ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["daily"],
                siteRootDir,
              };
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
          // checkNotes({
          //   filteredNotes: notes,
          //   engineNotes: engine.notes,
          //   match: [

          //   ]
          // });
        },
        {
          createEngine,
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
          const config = ConfigUtils.withConfig(
            (config) => {
              const bvault = config.vaults.find(
                (ent) => ent.fsPath === "vault2"
              );
              bvault!.visibility = DVaultVisibility.PRIVATE;
              const sconfig: DendronSiteConfig = {
                siteHierarchies: ["root"],
                siteRootDir,
                duplicateNoteBehavior: {
                  action: "useVault",
                  payload: {
                    vault: vaults[0],
                  },
                },
                config: {
                  root: {
                    publishByDefault: true,
                  },
                },
              };
              config.site = sconfig;
              return config;
            },
            { wsRoot }
          );
          const { notes, domains } = await SiteUtils.filterByConfig({
            engine,
            config,
          });
          const root = NoteUtilsV2.getNoteByFnameV4({
            fname: "root",
            notes: engine.notes,
            vault: vaults[0],
          });
          expect(domains.length).toEqual(2);
          expect(notes).toMatchSnapshot();
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [{ id: root!.id }, { id: "foo" }, { id: "foo.ch1" }],
          });
        },
        {
          createEngine,
          expect,
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
          },
        }
      );
    });
  });
});
