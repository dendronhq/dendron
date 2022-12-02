import {
  ConfigService,
  DendronConfig,
  NoteDictsUtils,
  NoteProps,
  URI,
} from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  getParsingDependencyDicts,
  MDUtilsV5,
  ProcDataFullOptsV5,
} from "@dendronhq/unified";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkNotInVFile, checkVFile, createProcTests } from "./utils";

function procDendronForPublish(
  opts: Omit<ProcDataFullOptsV5, "dest"> & {
    noteIndex: NoteProps;
  }
) {
  const { config, fname, vault, noteToRender, noteCacheForRenderDict } = opts;
  const proc = MDUtilsV5.procRehypeFull({
    noteToRender,
    config,
    fname,
    vault,
    noteCacheForRenderDict,
  });
  return proc;
}

describe("hierarchies", () => {
  const BASIC_TEXT = "[Ch1](foo.ch1.html)";
  const BASIC = createProcTests({
    name: "BASIC",
    setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
      const config = (
        await ConfigService.instance().readConfig(URI.file(wsRoot))
      )._unsafeUnwrap();
      config.publishing.enableHierarchyDisplay = true;
      const noteToRender = (
        await engine.findNotes({ fname: "foo", vault: vaults[0] })
      )[0];
      const noteCacheForRenderDict = await getParsingDependencyDicts(
        noteToRender,
        engine,
        config,
        vaults
      );
      NoteDictsUtils.add(
        (await engine.findNotes({ fname: "foo.ch1", vault: vaults[0] }))[0],
        noteCacheForRenderDict
      );
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          noteToRender,
          noteCacheForRenderDict,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
          config,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          noteToRender,
          noteCacheForRenderDict,
          fname: "foo",
          noteIndex: (await engine.getNote("foo")).data!,
          vault: vaults[0],
          config,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      }
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, BASIC_TEXT);
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, "Children");
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const NO_HIERARCHY = createProcTests({
    name: "NO_HIERARCHY",
    setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
      const rawConfig = (
        await ConfigService.instance().readRaw(URI.file(wsRoot))
      )._unsafeUnwrap() as DendronConfig;
      const config: DendronConfig = {
        ...rawConfig,
        publishing: {
          ...rawConfig.publishing,
          enableHierarchyDisplay: false,
        },
      };
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          noteToRender: (await engine.getNote("foo")).data!,
          fname: "foo",
          config,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          noteToRender: (await engine.getNote("foo")).data!,
          config,
          fname: "foo",
          noteIndex: (await engine.getNote("foo")).data!,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      }
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, BASIC_TEXT);
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkNotInVFile(resp, "Children");
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const NO_HIERARCHY_VIA_FM = createProcTests({
    name: "NO_HIERARCHY_VIA_FM",
    setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
      const config = (
        await ConfigService.instance().readConfig(URI.file(wsRoot))
      )._unsafeUnwrap();
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          noteToRender: (await engine.getNote("foo")).data!,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
          config,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          noteToRender: (await engine.getNote("foo")).data!,
          fname: "foo",
          noteIndex: (await engine.getNote("foo")).data!,
          vault: vaults[0],
          config,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      }
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, BASIC_TEXT);
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkNotInVFile(resp, "Children");
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
      await NoteTestUtilsV4.modifyNoteByPath(
        { wsRoot: opts.wsRoot, vault: opts.vaults[0], fname: "foo" },
        (note: NoteProps) => {
          note.custom.hierarchyDisplay = false;
          return note;
        }
      );
    },
  });

  const DIFF_HIERARCHY_TITLE = createProcTests({
    name: "DIFF_HIERARCHY_TITLE",
    setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
      const rawConfig = (
        await ConfigService.instance().readRaw(URI.file(wsRoot))
      )._unsafeUnwrap() as DendronConfig;
      const config: DendronConfig = {
        ...rawConfig,
        publishing: {
          ...rawConfig.publishing,
          hierarchyDisplayTitle: "Better Children",
        },
      };
      const noteToRender = (
        await engine.findNotes({ fname: "foo", vault: vaults[0] })
      )[0];
      const noteCacheForRenderDict = await getParsingDependencyDicts(
        noteToRender,
        engine,
        config,
        vaults
      );
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          noteToRender,
          noteCacheForRenderDict,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
          config,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          noteToRender,
          noteCacheForRenderDict,
          fname: "foo",
          noteIndex: (await engine.getNote("foo")).data!,
          vault: vaults[0],
          config,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      }
    },
    verifyFuncDict: {
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, "Better Children");
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const SKIP_LEVELS = createProcTests({
    name: "SKIP_LEVELS",
    setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
      const config = (
        await ConfigService.instance().readConfig(URI.file(wsRoot))
      )._unsafeUnwrap();
      const noteToRender = (
        await engine.findNotes({ fname: "daily", vault: vaults[0] })
      )[0];
      const noteCacheForRenderDict = await getParsingDependencyDicts(
        noteToRender,
        engine,
        config,
        vaults
      );
      NoteDictsUtils.add(
        (
          await engine.findNotes({
            fname: "daily.journal",
            vault: vaults[0],
          })
        )[0],
        noteCacheForRenderDict
      );
      NoteDictsUtils.add(
        (
          await engine.findNotes({
            fname: "daily.journal.2020",
            vault: vaults[0],
          })
        )[0],
        noteCacheForRenderDict
      );
      NoteDictsUtils.add(
        (
          await engine.findNotes({
            fname: "daily.journal.2020.07",
            vault: vaults[0],
          })
        )[0],
        noteCacheForRenderDict
      );
      NoteDictsUtils.add(
        (
          await engine.findNotes({
            fname: "daily.journal.2020.07.01",
            vault: vaults[0],
          })
        )[0],
        noteCacheForRenderDict
      );
      NoteDictsUtils.add(
        (
          await engine.findNotes({
            fname: "daily.journal.2020.07.01.one",
            vault: vaults[0],
          })
        )[0],
        noteCacheForRenderDict
      );
      NoteDictsUtils.add(
        (
          await engine.findNotes({
            fname: "daily.journal.2020.07.05",
            vault: vaults[0],
          })
        )[0],
        noteCacheForRenderDict
      );
      NoteDictsUtils.add(
        (
          await engine.findNotes({
            fname: "daily.journal.2020.07.05.two",
            vault: vaults[0],
          })
        )[0],
        noteCacheForRenderDict
      );
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          noteToRender,
          noteCacheForRenderDict,
          fname: "daily",
          dest: extra.dest,
          vault: vaults[0],
          config,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          noteToRender,
          noteCacheForRenderDict,
          fname: "daily",
          noteIndex: (await engine.getNote("daily")).data!,
          vault: vaults[0],
          config,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      }
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, BASIC_TEXT);
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(
          resp,
          "daily.journal.2020.07.01.one",
          "daily.journal.2020.07.05.two"
        );
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupJournals(opts);
      await NoteTestUtilsV4.modifyNoteByPath(
        { fname: "daily", vault: opts.vaults[0], wsRoot: opts.wsRoot },
        (note) => {
          note.custom.skipLevels = 4;
          return note;
        }
      );
    },
  });

  const ALL_TEST_CASES = [
    ...NO_HIERARCHY,
    ...NO_HIERARCHY_VIA_FM,
    ...BASIC,
    ...DIFF_HIERARCHY_TITLE,
    ...SKIP_LEVELS,
  ];

  test.each(
    ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
    // @ts-ignore
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
    });
  });
});
