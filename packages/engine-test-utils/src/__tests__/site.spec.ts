import {
  DendronSiteConfig,
  NotePropsDictV2,
  NotePropsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  file2Note,
  note2File,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import {
  ENGINE_HOOKS,
  NoteTestUtilsV4,
  runEngineTestV4,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import { createEngine, SiteUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";

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
    fname: string;
  } & Partial<NotePropsV2>)[];
  noMatch?: {
    fname: string;
  }[];
}) => {
  const { noMatch, filteredNotes, engineNotes } = opts;
  const notesActual = _.sortBy(_.values(opts.filteredNotes), "id");
  const notesExpected = _.map(opts.match, (opts) => {
    let note = { ...engineNotes[opts.fname] };
    note = { ...note, ...opts };
    return note;
  });
  expect(notesActual).toEqual(_.sortBy(notesExpected, "id"));
  if (noMatch) {
    expect(
      _.every(noMatch, ({ fname }) => {
        return !_.has(filteredNotes, fname);
      })
    ).toBeTruthy();
  }
};

describe("SiteUtils", () => {
  let siteRootDir: string;

  beforeEach(() => {
    siteRootDir = tmpDir().name;
  });

  describe("per note config", () => {
    test("blacklist note", async () => {
      await runEngineTestV4(
        async ({ engine }) => {
          const config: DendronSiteConfig = {
            siteHierarchies: ["foo"],
            siteRootDir,
            usePrettyRefs: true,
            config: {
              root: {
                publishByDefault: false,
              },
            },
          };
          const notes = await SiteUtils.filterByConfig({ engine, config });
          expect(notes).toMatchSnapshot();
          expect(_.size(notes)).toEqual(1);
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [{ fname: "foo", parent: null, children: [] }],
            noMatch: [{ fname: "foo.ch1" }],
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
      await runEngineTestV4(
        async ({ engine }) => {
          const config: DendronSiteConfig = {
            siteHierarchies: ["foo"],
            siteRootDir,
            usePrettyRefs: true,
            config: {
              root: {
                publishByDefault: false,
              },
            },
          };
          const notes = await SiteUtils.filterByConfig({ engine, config });
          expect(notes).toMatchSnapshot();
          expect(_.size(notes)).toEqual(2);
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [{ fname: "foo", parent: null }, { fname: "foo.ch1" }],
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

    test.skip("all hiearchies", async () => {
      await runEngineTestV4(
        async ({ engine }) => {
          const config: DendronSiteConfig = {
            siteHierarchies: ["root"],
            siteRootDir,
            usePrettyRefs: true,
            config: {
              root: {
                publishByDefault: false,
              },
            },
          };
          const notes = await SiteUtils.filterByConfig({ engine, config });
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [
              { fname: "foo", parent: null },
              { fname: "bar", parent: null },
              { fname: "foo.ch1" },
            ],
          });
        },
        {
          createEngine,
          expect,
          preSetupHook: async (opts) => {
            ENGINE_HOOKS.setupBasic(opts);
            const vault = opts.vaults[1];
            const wsRoot = opts.wsRoot;
            const npath = path.join(vault2Path({ vault, wsRoot }), "root.md");
            const note = file2Note(npath, vault);
            note.custom = { published: false };
            await note2File({ note, vault, wsRoot });
          },
        }
      );
    });

    test("one hiearchy", async () => {
      await runEngineTestV4(
        async ({ engine }) => {
          const config: DendronSiteConfig = {
            siteHierarchies: ["foo"],
            siteRootDir,
            usePrettyRefs: true,
            config: {
              root: {
                publishByDefault: false,
              },
            },
          };
          const notes = await SiteUtils.filterByConfig({ engine, config });
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [{ fname: "foo", parent: null }, { fname: "foo.ch1" }],
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
      await runEngineTestV4(
        async ({ engine }) => {
          const config: DendronSiteConfig = {
            siteHierarchies: ["foo", "bar"],
            siteRootDir,
            usePrettyRefs: true,
            config: {
              root: {
                publishByDefault: false,
              },
            },
          };
          const notes = await SiteUtils.filterByConfig({ engine, config });
          checkNotes({
            filteredNotes: notes,
            engineNotes: engine.notes,
            match: [
              { fname: "foo", parent: null },
              { fname: "foo.ch1" },
              { fname: "bar", parent: null },
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
  });
});
