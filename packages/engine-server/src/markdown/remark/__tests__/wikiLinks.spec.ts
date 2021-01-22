import { DEngineClientV2, WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import {
  getLogFilePath,
  NoteTestUtilsV4,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { Node } from "unist";
import { DendronEngineV2 } from "../../../enginev2";
import { DendronASTData, DendronASTDest, WikiLinkNoteV4 } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { wikiLinks, WikiLinksOpts } from "../wikiLinks";

function proc(
  engine: DEngineClientV2,
  dendron: DendronASTData,
  opts?: WikiLinksOpts
) {
  return MDUtilsV4.proc({ engine })
    .data("dendron", dendron)
    .use(wikiLinks, opts);
}

function getWikiLink(node: Node): WikiLinkNoteV4 {
  // @ts-ignore
  return node.children[0].children[0];
}

describe("parse", () => {
  let engine: any;
  let dendronData = { dest: DendronASTDest.MD_REGULAR };

  test("basic", () => {
    const resp = proc(engine, dendronData).parse(`[[foo.md]]`);
    expect(getWikiLink(resp).type).toEqual("wikiLink");
  });

  test("link with space", () => {
    const resp = proc(engine, dendronData).parse(`[[foo bar]]`);
    expect(_.pick(getWikiLink(resp), ["type", "value"])).toEqual({
      type: "wikiLink",
      value: "foo bar",
    });
  });

  test("doesn't parse inline code block", () => {
    const resp = proc(engine, dendronData).parse("`[[foo.md]]`");
    expect(getWikiLink(resp).type).toEqual("inlineCode");
  });
});

// const checkContents = (respProcess: VFile, cmp: string) => {
//   expect(_.trim(respProcess.contents as string)).toEqual(cmp);
// };

// const BASIC = createProcTests({
//   name: "BASIC",
//   setupFunc: async (opts) => {
//     let proc = await createProc(opts, {});
//     return processText({ proc, text: "[[foo]]" });
//   },
//   preSetupHook: ENGINE_HOOKS.setupBasic,
//   verifyFuncDict: {
//     [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
//       const { respProcess } = extra;
//       checkContents(respProcess, "[foo](foo)");
//     },
//     [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
//       const { respProcess } = extra;
//       checkContents(respProcess, "[foo](foo.md)");
//     },
//     [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
//       const { respProcess } = extra;
//       checkContents(respProcess, "[[foo]]");
//     },
//     [DendronASTDest.HTML]: async ({ extra }) => {
//       const { respProcess } = extra;
//       checkContents(respProcess, "[foo](foo.html)");
//     },
//   },
// });

// const ALL_TEST_CASES = [
//   ...BASIC,
//   ...HELLO_FILTER,

// describe("compile", () => {
//   test.each(
//     ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
//   )("%p", async (_key, testCase: TestPresetEntryV4) => {
//     await runEngineTestV4(testCase.testFunc, {
//       expect,
//       createEngine,
//       preSetupHook: testCase.preSetupHook,
//     });
//   });
// });

// ===
const createEngine = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const logger = createLogger("testLogger", getLogFilePath("engine-server"));
  const engine = DendronEngineV2.createV3({ vaults, wsRoot, logger });
  return engine;
};

const basicSetup = async ({ wsRoot, vaults }: WorkspaceOpts) => {
  await NoteTestUtilsV4.createNote({
    wsRoot,
    fname: "foo",
    vault: vaults[0],
    props: { id: "foo-id" },
  });
};

const getTextString1 = (link = `[[FAQ | dendron.faq]]`) =>
  `See the ${link} for answers for`;
describe("compilev2", () => {
  const linkRegular = "[[foo]]";
  const linkWithAnchor = "[[foo#one]]";
  const linkWithExtension = "[[foo.md]]";
  const linkWithAlias = `[[bar|foo]]`;
  const linkWithSpace = `[[bar|foo bar]]`;
  const textString1 = getTextString1();

  const expected: { [key in DendronASTDest]: any } = {
    [DendronASTDest.MD_DENDRON]: {
      regular: {
        link: linkRegular,
      },
      regularWithAnchor: {
        link: linkWithAnchor,
      },
      regularWithExtension: {
        link: linkRegular,
      },
      alias: {
        link: linkWithAlias,
      },
      withId: {
        link: linkRegular,
      },
      withSpace: {
        link: linkWithSpace,
      },
      textString1: {
        link: getTextString1(`[[FAQ|dendron.faq]]`),
      },
    },
    [DendronASTDest.HTML]: {
      regular: {
        link: `[foo](foo.html)`,
      },
      regularWithAnchor: {
        link: `[foo](foo.html#one)`,
      },
      regularWithExtension: {
        link: `[foo](foo.html)`,
      },
      alias: {
        link: `[bar](foo.html)`,
      },
      withId: {
        link: `[foo](foo-id.html)`,
      },
      withSpace: {
        link: `[bar](foo bar.html)`,
      },
      textString1: {
        link: getTextString1(`[FAQ](dendron.faq.html)`),
      },
    },
    [DendronASTDest.MD_REGULAR]: {
      regular: {
        link: `[foo](foo)`,
      },
      regularWithAnchor: {
        link: `[foo](foo)`,
      },
      regularWithExtension: {
        link: `[foo](foo)`,
      },
      alias: {
        link: `[bar](foo)`,
      },
      withId: {
        link: `[foo](foo-id)`,
      },
      withSpace: {
        link: `[bar](foo%20bar)`,
      },
      textString1: {
        link: getTextString1(`[FAQ](dendron.faq)`),
      },
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: {
      regular: {
        link: `[foo](foo.md)`,
      },
      regularWithAnchor: {
        link: `[foo](foo.md)`,
      },
      regularWithExtension: {
        link: `[foo](foo.md)`,
      },
      alias: {
        link: `[bar](foo.md)`,
      },
      withId: {
        link: `[foo](foo-id.md)`,
      },
      withSpace: {
        link: `[bar](foo%20bar.md)`,
      },
      textString1: {
        link: getTextString1(`[FAQ](dendron.faq.md)`),
      },
    },
  };

  const testCases = [
    {
      testCase: "regular",
      linkProcess: linkRegular,
      preSetupHook: undefined,
      procOpts: {},
    },
    {
      testCase: "regularWithAnchor",
      linkProcess: linkWithAnchor,
      preSetupHook: undefined,
      procOpts: {},
    },
    {
      testCase: "regularWithExtension",
      linkProcess: linkWithExtension,
      preSetupHook: undefined,
      procOpts: {},
    },
    { testCase: "alias", linkProcess: linkWithAlias },
    {
      testCase: "withId",
      linkProcess: linkWithExtension,
      preSetupHook: basicSetup,
      procOpts: { useId: true },
    },
    {
      testCase: "textString1",
      linkProcess: textString1,
    },
    {
      testCase: "withSpace",
      linkProcess: linkWithSpace,
      preSetupHook: basicSetup,
    },
  ];

  Object.values(DendronASTDest).map((key) => {
    const dest = key as DendronASTDest;
    describe(dest, () => {
      test.each(testCases.map((ent) => [ent.testCase, ent]))(
        "%p",
        async (_key, obj: typeof testCases[0]) => {
          const { testCase, linkProcess, preSetupHook, procOpts } = obj;
          await runEngineTestV4(
            async ({ engine }) => {
              const resp = await proc(
                engine,
                {
                  dest,
                },
                procOpts
              ).process(linkProcess);
              expect(resp).toMatchSnapshot();
              expect(_.trim(resp.toString())).toEqual(
                expected[dest][testCase].link
              );
            },
            { expect, createEngine, preSetupHook }
          );
        }
      );
    });
  });
});
