import { IntermediateDendronConfig, NoteProps } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  MDUtilsV5,
  ProcDataFullOptsV5,
} from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkNotInVFile, checkVFile, createProcTests } from "./utils";

function procDendronForPublish(
  opts: Omit<ProcDataFullOptsV5, "dest"> & {
    noteIndex: NoteProps;
    configOverride?: IntermediateDendronConfig;
  }
) {
  const { engine, configOverride, fname, vault } = opts;
  const proc = MDUtilsV5.procRehypeFull({
    engine,
    config: configOverride,
    fname,
    vault,
  });
  return proc;
}

describe("hierarchies", () => {
  const BASIC_TEXT = "[Ch1](foo.ch1.html)";
  const BASIC = createProcTests({
    name: "BASIC",
    setupFunc: async ({ engine, vaults, extra }) => {
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          engine,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          engine,
          fname: "foo",
          noteIndex: engine.notes["foo"],
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
        await checkVFile(resp, "Children");
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const NO_HIERARCHY = createProcTests({
    name: "NO_HIERARCHY",
    setupFunc: async ({ engine, vaults, extra }) => {
      const configOverride: IntermediateDendronConfig = {
        ...engine.config,
        hierarchyDisplay: false,
      };
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          engine,
          fname: "foo",
          config: configOverride,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          engine,
          configOverride,
          fname: "foo",
          noteIndex: engine.notes["foo"],
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
    setupFunc: async ({ engine, vaults, extra }) => {
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          engine,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          engine,
          fname: "foo",
          noteIndex: engine.notes["foo"],
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
    setupFunc: async ({ engine, vaults, extra }) => {
      const configOverride: IntermediateDendronConfig = {
        ...engine.config,
        hierarchyDisplayTitle: "Better Children",
      };
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          engine,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          engine,
          fname: "foo",
          noteIndex: engine.notes["foo"],
          vault: vaults[0],
          configOverride,
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
    setupFunc: async ({ engine, vaults, extra }) => {
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV5.procRemarkFull({
          engine,
          fname: "daily",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = procDendronForPublish({
          engine,
          fname: "daily",
          noteIndex: engine.notes["daily"],
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
