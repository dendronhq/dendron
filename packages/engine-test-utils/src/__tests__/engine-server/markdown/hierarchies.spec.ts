import { DendronConfig } from "@dendronhq/common-all";
import { ENGINE_HOOKS, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import { checkVFile, createProcTests } from "./utils";

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

  const DIFF_HIERARCHY_TITLE = createProcTests({
    name: "DIFF_HIERARCHY_TITLE",
    setupFunc: async ({ engine, vaults, extra }) => {
      const configOverride: DendronConfig = {
        ...engine.config,
        hiearchyDisplayTitle: "Better Children",
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
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, BASIC_TEXT);
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, "Better Children");
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const ALL_TEST_CASES = [...BASIC, ...DIFF_HIERARCHY_TITLE];
  test.each(
    ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
    });
  });
});
