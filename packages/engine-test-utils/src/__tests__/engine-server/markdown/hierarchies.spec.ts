import { DendronConfig } from "@dendronhq/common-all";
import {
  ENGINE_HOOKS,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import { checkNotInVFile, checkVFile, createProcTests } from "./utils";

describe("hierarchies", () => {
  const BASIC_TEXT = "[Ch1](foo.ch1.html)";
  const BASIC = createProcTests({
    name: "BASIC",
    setupFunc: async ({ engine, vaults, extra }) => {
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV4.procDendron({
          engine,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = MDUtilsV4.procDendronForPublish({
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
      const configOverride: DendronConfig = {
        ...engine.config,
        hierarchyDisplay: false,
      };
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV4.procDendron({
          engine,
          fname: "foo",
          configOverride,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = MDUtilsV4.procDendronForPublish({
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

  const DIFF_HIERARCHY_TITLE = createProcTests({
    name: "DIFF_HIERARCHY_TITLE",
    setupFunc: async ({ engine, vaults, extra }) => {
      const configOverride: DendronConfig = {
        ...engine.config,
        hierarchyDisplayTitle: "Better Children",
      };
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV4.procDendron({
          engine,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
          configOverride,
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = MDUtilsV4.procDendronForPublish({
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
      // [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
      //   const { resp } = extra;
      //   await checkVFile(resp, BASIC_TEXT);
      // },
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
        const proc = MDUtilsV4.procDendron({
          engine,
          fname: "daily",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        debugger;
        const proc = MDUtilsV4.procDendronForPublish({
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
    ...BASIC,
    ...DIFF_HIERARCHY_TITLE,
    ...SKIP_LEVELS,
  ];

  test.each(
    ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
    });
  });
});
