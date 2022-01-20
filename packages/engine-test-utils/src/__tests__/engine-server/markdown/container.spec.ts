import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "../../../presets";
import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import { checkNotInVFile, checkVFile, createProcTests } from "./utils";
import { ConfigUtils } from "@dendronhq/common-all";

describe("containers", () => {
  const containerText = [
    "::: aside class-one class-two",
    "# Header One",
    "With container contents. ",
    ":::",
  ].join("\n");
  const REGULAR_CASE = createProcTests({
    name: "REGULAR_CASE",
    setupFunc: async ({ engine, vaults, extra }) => {
      // create copy of engine config
      const config = { ...engine.config };
      ConfigUtils.setPublishProp(config, "enableContainers", true);
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV4.procFull({
          engine,
          config,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(containerText);
        return { resp };
      } else {
        const proc = MDUtilsV4.procHTML({
          engine,
          config,
          fname: "foo",
          noteIndex: engine.notes["foo"],
          vault: vaults[0],
        });
        const resp = await proc.process(containerText);
        return { resp };
      }
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(
          resp,
          "::: aside class-one class-two",
          "# Header One",
          "With container contents. ",
          ":::"
        );
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(
          resp,
          '<aside class="class-one class-two"><h1 id="header-one"><a aria-hidden="true" class="anchor-heading" href="#header-one"><svg aria-hidden="true" viewBox="0 0 16 16"><use xlink:href="#svg-link"></use></svg></a>Header One</h1><p>With container contents. </p></aside>'
        );
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });
  const NOT_ENABLED = createProcTests({
    name: "NOT_ENABLED",
    setupFunc: async ({ engine, vaults, extra }) => {
      // create copy of engine config
      let config = { ...engine.config };
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV4.procFull({
          engine,
          config,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(containerText);
        return { resp };
      } else {
        const proc = MDUtilsV4.procHTML({
          engine,
          config,
          fname: "foo",
          noteIndex: engine.notes["foo"],
          vault: vaults[0],
        });
        const resp = await proc.process(containerText);
        return { resp };
      }
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(
          resp,
          "::: aside class-one class-two",
          "# Header One",
          "With container contents. ",
          ":::"
        );
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkNotInVFile(
          resp,
          '<aside class="class-one class-two"><h1 id="header-one"><a aria-hidden="true" class="anchor-heading" href="#header-one"><svg aria-hidden="true" viewBox="0 0 16 16"><use xlink:href="#svg-link"></use></svg></a>Header One</h1><p>With container contents. </p></aside>'
        );
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const ALL_TEST_CASES = [...REGULAR_CASE, ...NOT_ENABLED];
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
