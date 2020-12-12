import { DEngineClientV2, WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import {
  AssertUtils,
  ENGINE_HOOKS,
  runEngineTestV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "../../../enginev2";
import { DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { noteRefs, NoteRefsOpts } from "../noteRefs";

function proc(engine: DEngineClientV2, opts: NoteRefsOpts) {
  return MDUtilsV4.proc({ engine }).use(noteRefs, opts);
}

const createEngine = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const logger = createLogger("testLogger", "/tmp/engine-server.txt");
  const engine = DendronEngineV2.createV3({ vaults, wsRoot, logger });
  return engine;
};

describe.skip("parse", () => {
  let engine: any;
  let dest: DendronASTDest.MD_REGULAR;

  test("init", () => {
    const resp = proc(engine, { dest }).parse(`((ref: [[foo.md]]))`);
    expect(resp).toMatchSnapshot();
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("refLink");
  });

  test("doesn't parse inline code block", () => {
    const resp = proc(engine, { dest }).parse("`((ref: [[foo.md]]))`");
    expect(resp).toMatchSnapshot("bond");
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("inlineCode");
  });
});

// future
// type TestCase<TData, TExpected> = {
//   testCase: string;
//   data: TData;
//   expected: TExpected;
// };

describe("compilev2", () => {
  const linkWithNoExtension = "((ref: [[foo]]))";

  function createTestCases(opts: {
    name: string;
    setupFunc: TestPresetEntryV4["testFunc"];
    verifyFuncDict: { [key in DendronASTDest]: TestPresetEntryV4["testFunc"] };
    preSetupHook?: TestPresetEntryV4["preSetupHook"];
  }) {
    const { name, setupFunc, verifyFuncDict } = opts;
    return Object.values(DendronASTDest).map((dest) => {
      const verifyFunc = verifyFuncDict[dest];
      return {
        name,
        dest,
        testCase: new TestPresetEntryV4(
          async (presetOpts) => {
            const extra = await setupFunc({ ...presetOpts, extra: { dest } });
            return await verifyFunc({ ...presetOpts, extra });
          },
          { preSetupHook: opts.preSetupHook }
        ),
      };
    });
  }

  const REGULAR_CASE = createTestCases({
    name: "regular",
    setupFunc: async ({ engine, extra }) => {
      const resp = await proc(engine, {
        dest: extra.dest,
      }).process(linkWithNoExtension);
      return { resp, proc };
    },
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["foo body"],
            }),
            expected: true,
          },
        ];
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["foo body", "portal"],
            }),
            expected: true,
          },
        ];
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });
  const RECURSIVE_TEST_CASES = createTestCases({
    name: "recursive",
    setupFunc: async ({ engine, extra }) => {
      const resp = await proc(engine, {
        dest: extra.dest,
      }).process(linkWithNoExtension);
      return { resp, proc };
    },
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["# Foo", "# Foo.One", "# Foo.Two"],
            }),
            expected: true,
          },
        ];
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["# Foo", "# Foo.One", "# Foo.Two", "portal"],
            }),
            expected: true,
          },
        ];
      },
    },
    preSetupHook: ENGINE_HOOKS.setupNoteRefRecursive,
  });

  const ALL_TEST_CASES = [...REGULAR_CASE, ...RECURSIVE_TEST_CASES];
  describe("compile", () => {
    test.each(
      ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV4(testCase.testFunc, {
        expect,
        createEngine,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
});
