import { DendronSiteConfig, WorkspaceOpts } from "@dendronhq/common-all";
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
          expect(notes["foo"]).toEqual(engine.notes["foo"]);
          expect(notes["foo.ch1"]).toEqual(undefined);
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
  });

  describe("per hierarchy config", () => {
    let siteRootDir: string;

    beforeEach(() => {
      siteRootDir = tmpDir().name;
    });

    test("all hiearchies", async () => {
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
          expect(_.size(notes)).toEqual(3);
          expect(notes["foo"]).toEqual(engine.notes["foo"]);
          expect(notes["bar"]).toEqual(engine.notes["bar"]);
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
          expect(_.size(notes)).toEqual(2);
          expect(notes["foo"]).toEqual(engine.notes["foo"]);
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
          expect(_.size(notes)).toEqual(3);
          expect(notes["foo"]).toEqual(engine.notes["foo"]);
          expect(notes["bar"]).toEqual(engine.notes["bar"]);
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
