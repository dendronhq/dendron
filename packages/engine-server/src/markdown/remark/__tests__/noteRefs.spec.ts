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

  const testCases = [
    // {
    //   testCase: "regular",
    //   linkProcess: linkWithNoExtension,
    //   preSetupHook: basicSetup,
    //   procOpts: {},
    //   expected: {
    //     [DendronASTDest.HTML]: {
    //       result: "foo body",
    //     },
    //     [DendronASTDest.MD_REGULAR]: {
    //       result: "foo body",
    //     },
    //   },
    // },
    {
      testCase: "recursive",
      linkProcess: linkWithNoExtension,
      preSetupHook: ENGINE_HOOKS.setupNoteRefRecursive,
      procOpts: {},
      expected: {
        [DendronASTDest.HTML]: {
          result: "foo body",
        },
        [DendronASTDest.MD_REGULAR]: {
          result: "foo body",
        },
      },
    },
  ];

  Object.values(DendronASTDest)
    .slice(0, 1)
    .map((key) => {
      const dest = key as DendronASTDest;

      const testCases = [
        {
          name: "recursive",
          testCase: new TestPresetEntryV4(
            async ({ engine }) => {
              const resp = await proc(engine, {
                dest,
              }).process(linkWithNoExtension);
              expect(resp).toMatchSnapshot("bond");
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
            {
              preSetupHook: ENGINE_HOOKS.setupNoteRefRecursive,
            }
          ),
        },
      ];

      describe(dest, () => {
        test.each(testCases.map((ent) => [ent.name, ent]))(
          "%p",
          async (_key, obj: typeof testCases[0]) => {
            // const { linkProcess, preSetupHook, procOpts, expected } = obj;
            const { testCase } = obj;
            await runEngineTestV4(
              testCase.testFunc,

              // async ({ engine }) => {
              //   const resp = await proc(engine, {
              //     dest,
              //     ...procOpts,
              //   }).process(linkProcess);
              //   expect(resp).toMatchSnapshot();
              //   expect(_.trim(resp.toString())).toEqual(expected[dest].result);
              // },
              { expect, createEngine, preSetupHook: testCase.preSetupHook }
            );
          }
        );
      });
    });
});
