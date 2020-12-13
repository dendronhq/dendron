import { DEngineClientV2, WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { NoteTestUtilsV4, runEngineTestV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { DendronEngineV2 } from "../../../enginev2";
import { DendronASTData, DendronASTDest } from "../../types";
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

describe("parse", () => {
  let engine: any;
  let dendronData = { dest: DendronASTDest.MD_REGULAR };

  test("init", () => {
    const resp = proc(engine, dendronData).parse(`[[foo.md]]`);
    expect(resp).toMatchSnapshot();
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("wikiLink");
  });

  test("doesn't parse inline code block", () => {
    const resp = proc(engine, dendronData).parse("`[[foo.md]]`");
    expect(resp).toMatchSnapshot("bond");
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("inlineCode");
  });
});

const createEngine = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const logger = createLogger("testLogger", "/tmp/engine-server.txt");
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
  const linkWithNoExtension = "[[foo]]";
  const linkWithExtension = "[[foo.md]]";
  const linkWithAlias = `[[bar|foo]]`;
  const textString1 = getTextString1();

  const expected: { [key in DendronASTDest]: any } = {
    [DendronASTDest.HTML]: {
      regular: {
        link: `[foo](foo.html)`,
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
      textString1: {
        link: getTextString1(`[FAQ](dendron.faq.html)`),
      },
    },
    [DendronASTDest.MD_REGULAR]: {
      regular: {
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
      textString1: {
        link: getTextString1(`[FAQ](dendron.faq)`),
      },
    },
    // [DendronASTDest.MD_ENHANCED_PREVIEW]: {
    //   regular: {
    //     link: `[foo](foo)`,
    //   },
    // },
  };

  const testCases = [
    {
      testCase: "regular",
      linkProcess: linkWithNoExtension,
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
