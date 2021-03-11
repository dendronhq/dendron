import { DEngineClientV2, DVault } from "@dendronhq/common-all";
import { ENGINE_HOOKS, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  HierarchiesOpts,
  MDUtilsV4,
} from "@dendronhq/engine-server";
import { runEngineTestV5, testWithEngine } from "../../../engine";
import { checkVFile, createProcTests } from "./utils";

function cproc(opts: {
  engine: DEngineClientV2;
  vault: DVault;
  opts?: HierarchiesOpts;
}) {
  const { engine, vault } = opts;
  const proc = MDUtilsV4.procFull({
    dest: DendronASTDest.HTML,
    engine,
    vault,
    fname: "foo",
    hiearchyDisplayTitle: opts.opts?.hiearchyDisplayTitle,
  });
  return proc;
}

describe("hierarchies", () => {
  describe("single", () => {
    testWithEngine("basic", async ({ engine, vaults }) => {
      const vault = vaults[0];
      const content = engine.notes["foo"].body;
      const resp = await cproc({ engine, vault }).process(content);
      await checkVFile(resp, "[Ch1](foo.ch1.html)");
    });

    testWithEngine("with updated name", async ({ engine, vaults }) => {
      const vault = vaults[0];
      const content = engine.notes["foo"].body;
      const resp = await cproc({
        engine,
        vault,
        opts: { hiearchyDisplayTitle: "Better Children" },
      }).process(content);
      await checkVFile(resp, "[Ch1](foo.ch1.html)", "## Better Children");
    });
  });

  const BASIC_TEXT = "[Ch1](foo.ch1.html)";
  const BASIC = createProcTests({
    name: "BASIC",
    setupFunc: async ({ engine, vaults, extra }) => {
      let config = { ...engine.config };
      if (extra.dest !== DendronASTDest.HTML) {
        const proc = MDUtilsV4.procDendron({
          engine,
          config,
          fname: "foo",
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(BASIC_TEXT);
        return { resp };
      } else {
        const proc = MDUtilsV4.procDendronForPublish({
          engine,
          config,
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
        await checkVFile(
          resp,
          '<aside class="class-one class-two"><h1 id="header-one"><a aria-hidden="true" class="anchor-heading" href="#header-one"><svg aria-hidden="true" viewBox="0 0 16 16"><use xlink:href="#svg-link"></use></svg></a>Header One</h1><p>With container contents. </p></aside>'
        );
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });
  const ALL_TEST_CASES = [...BASIC];
  test.each(
    ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
    });
  });
});
