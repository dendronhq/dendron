import { ProcFlavor } from "@dendronhq/common-all";
import { AssertUtils, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import { BacklinkOpts, DendronASTDest } from "@dendronhq/unified";
import { runEngineTestV5 } from "../../../../engine";
import { ENGINE_HOOKS } from "../../../../presets";
import { createProcCompileTests, ProcTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

/**
 * Helper function to run a single test for Backlinks Panel Hover rendering
 * @param param0
 * @returns
 */
function singleBacklinksPanelTest({
  testName,
  noteBody,
  backlinkHoverOpts,
  match,
}: {
  testName: string;
  noteBody: string;
  backlinkHoverOpts: BacklinkOpts;
  match: string[];
}) {
  return createProcCompileTests({
    name: testName,
    procOpts: {
      backlinkHoverOpts,
    },
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const resp = await proc.process(noteBody);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.MD_REGULAR]: {
        [ProcFlavor.BACKLINKS_PANEL_HOVER]: async ({ extra }) => {
          const { resp } = extra;
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match,
              }),
              expected: true,
            },
          ];
        },
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });
}

function runAllTests(opts: {
  name: string;
  testCases: ProcTests[];
  only?: boolean;
}) {
  const { name, testCases } = opts;
  // Work around the husky check triggering accidentally
  const _describe = opts["only"] ? describe["only"] : describe;
  _describe(name, () => {
    test.each(
      testCases.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
      // @ts-ignore
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV5(testCase.testFunc, {
        expect,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
}

describe("GIVEN a note to render for the backlinks panel hover control", () => {
  /**
   * Tests for Wikilinks
   */
  describe("WHEN the link is a wiklink", () => {
    const BACKLINK_BY_ITSELF = singleBacklinksPanelTest({
      testName: "THEN the backlink text is highlighted with an HTML span",
      noteBody: "[[foo]]",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 8,
          },
        },
      },
      match: [
        '<span style="color:#000;background-color:#FFFF00;">[[foo]]</span>',
      ],
    });

    const WITH_OTHER_TEXT = singleBacklinksPanelTest({
      testName:
        "THEN text surrounding the wikilink on the same line is NOT highlighted",
      noteBody: "before [[foo]] after",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 8,
          },
          end: {
            line: 1,
            column: 15,
          },
        },
      },
      match: [
        'before <span style="color:#000;background-color:#FFFF00;">[[foo]]</span> after',
      ],
    });

    const WITH_FULL_NOTE_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN start and end of note markers are rendered if the context spans the entire note",
      noteBody: `-before
-before
-before
[[foo]]
-after
-after
-after`,
      backlinkHoverOpts: {
        linesOfContext: 5,
        location: {
          start: {
            line: 3,
            column: 1,
          },
          end: {
            line: 3,
            column: 1,
          },
        },
      },
      match: [
        "--- <i>Start of Note</i> ---",
        "-before",
        "--- <i>End of Note</i> ---",
        "-after",
      ],
    });

    const WITH_TRUNCATED_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN before and after line markers are rendered if the context does NOT span the entire note",
      noteBody: `-before
-before
-before
[[foo]]
-after
-after
-after`,
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 4,
            column: 1,
          },
          end: {
            line: 4,
            column: 7,
          },
        },
      },
      match: [
        "--- <i>Line 1</i> ---",
        "-before",
        "--- <i>Line 7</i> ---",
        "-after",
      ],
    });

    const WITH_TRUNCATED_CODE_BLOCKS_AS_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN code blocks before and after that are truncated by the context limits still render properly",
      noteBody: `\`\`\`markdown
-before
-before
-before
\`\`\`
[[foo]]
\`\`\`markdown
-after
-after
-after
\`\`\``,
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 6,
            column: 1,
          },
          end: {
            line: 6,
            column: 8,
          },
        },
      },
      match: [
        "--- <i>Line 3</i> ---",
        "```markdown\n" +
          "-before\n" +
          "```\n" +
          "\n" +
          '<span style="color:#000;background-color:#FFFF00;">[[foo]]</span>\n' +
          "\n" +
          "```markdown\n" +
          "-after\n" +
          "```\n",
        "--- <i>Line 9</i> ---",
      ],
    });

    const WITH_BLOCK_ANCHOR = singleBacklinksPanelTest({
      testName: "THEN the block anchor is included in the highlighted span",
      noteBody: "[[foo#^123]]",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 8,
          },
        },
      },
      match: [
        '<span style="color:#000;background-color:#FFFF00;">[[foo#^123]]</span>',
      ],
    });

    // TODO: Add this failing test once its fixed. Current problem is that the
    // wikilink doesn't contain the proper data to distinguish when the alias
    // was explicilty vs implicitly added

    // const WITH_ALIAS = singleBacklinksPanelTest({
    //   testName: "THEN the alias is included in the highlighted span",
    //   noteBody: "[[Foo|foo]]",
    //   backlinkHoverOpts: {
    //     linesOfContext: 2,
    //     location: {
    //       start: {
    //         line: 1,
    //         column: 1,
    //       },
    //       end: {
    //         line: 1,
    //         column: 12,
    //       },
    //     },
    //   },
    //   match: [
    //     '<span style="color:#000;background-color:#FFFF00;">[[Foo|foo]]</span>',
    //   ],
    // });

    // TODO: Add this failing test once its fixed. Current problem is that the
    // wikilink doesn't contain the proper data to render the cross vault
    // prefix.

    // const WITH_CROSS_VAULT_PREFIX = singleBacklinksPanelTest({
    //   testName:
    //     "THEN the cross vault prefix is included in the highlighted span",
    //   noteBody: "[[dendron://vault/foo]]",
    //   backlinkHoverOpts: {
    //     linesOfContext: 2,
    //     location: {
    //       start: {
    //         line: 1,
    //         column: 1,
    //       },
    //       end: {
    //         line: 1,
    //         column: 28,
    //       },
    //     },
    //   },
    //   match: [
    //     '<span style="color:#000;background-color:#FFFF00;">[[dendron://vault/foo]]</span>',
    //   ],
    // });

    runTestCases([
      ...BACKLINK_BY_ITSELF,
      ...WITH_OTHER_TEXT,
      ...WITH_FULL_NOTE_CONTEXT,
      ...WITH_TRUNCATED_CONTEXT,
      ...WITH_TRUNCATED_CODE_BLOCKS_AS_CONTEXT,
      ...WITH_BLOCK_ANCHOR,
    ]);
  });

  /**
   * Tests for Note Refs
   */
  describe("WHEN the link is a note ref", () => {
    const BACKLINK_BY_ITSELF = singleBacklinksPanelTest({
      testName: "THEN the backlink text is highlighted with an HTML span",
      noteBody: "![[foo]]",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 1,
          },
        },
      },
      match: [
        '<span style="color:#000;background-color:#FFFF00;">![[foo]]</span>',
      ],
    });

    const WITH_OTHER_TEXT = singleBacklinksPanelTest({
      testName:
        "THEN text surrounding the wikilink on the same line is NOT highlighted",
      noteBody: "before ![[foo]] after",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 8,
          },
          end: {
            line: 1,
            column: 15,
          },
        },
      },
      match: [
        'before <span style="color:#000;background-color:#FFFF00;">![[foo]]</span> after',
      ],
    });

    const WITH_FULL_NOTE_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN start and end of note markers are rendered if the context spans the entire note",
      noteBody: `-before
-before
-before
![[foo]]
-after
-after
-after`,
      backlinkHoverOpts: {
        linesOfContext: 5,
        location: {
          start: {
            line: 3,
            column: 1,
          },
          end: {
            line: 3,
            column: 1,
          },
        },
      },
      match: [
        "--- <i>Start of Note</i> ---",
        "-before",
        "--- <i>End of Note</i> ---",
        "-after",
      ],
    });

    const WITH_TRUNCATED_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN before and after line markers are rendered if the context does NOT span the entire note",
      noteBody: `-before
-before
-before
![[foo]]
-after
-after
-after`,
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 4,
            column: 1,
          },
          end: {
            line: 4,
            column: 9,
          },
        },
      },
      match: [
        "--- <i>Line 1</i> ---",
        "-before",
        "--- <i>Line 7</i> ---",
        "-after",
      ],
    });

    const WITH_TRUNCATED_CODE_BLOCKS_AS_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN code blocks before and after that are truncated by the context limits still render properly",
      noteBody: `\`\`\`markdown
-before
-before
-before
\`\`\`
![[foo]]
\`\`\`markdown
-after
-after
-after
\`\`\``,
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 6,
            column: 1,
          },
          end: {
            line: 6,
            column: 9,
          },
        },
      },
      match: [
        "--- <i>Line 3</i> ---",
        "```markdown\n" +
          "-before\n" +
          "```\n" +
          "\n" +
          '<span style="color:#000;background-color:#FFFF00;">![[foo]]</span>\n' +
          "\n" +
          "```markdown\n" +
          "-after\n" +
          "```\n",
        "--- <i>Line 9</i> ---",
      ],
    });

    const WITH_BLOCK_ANCHOR = singleBacklinksPanelTest({
      testName: "THEN the block anchor is included in the highlighted span",
      noteBody: "![[foo#^123]]",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 8,
          },
        },
      },
      match: [
        '<span style="color:#000;background-color:#FFFF00;">![[foo#^123]]</span>',
      ],
    });

    const WITH_RANGED_ANCHORS = singleBacklinksPanelTest({
      testName: "THEN the anchor ranges are properly rendered",
      noteBody: "![[foo#start:#end]]",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 8,
          },
        },
      },
      match: [
        '<span style="color:#000;background-color:#FFFF00;">![[foo#start:#end]]</span>',
      ],
    });

    runAllTests({
      name: "THEN statements",
      testCases: [
        ...BACKLINK_BY_ITSELF,
        ...WITH_OTHER_TEXT,
        ...WITH_FULL_NOTE_CONTEXT,
        ...WITH_TRUNCATED_CONTEXT,
        ...WITH_TRUNCATED_CODE_BLOCKS_AS_CONTEXT,
        ...WITH_BLOCK_ANCHOR,
        ...WITH_RANGED_ANCHORS,
      ],
    });
  });

  /**
   * Tests for Link Candidates
   */
  describe("WHEN the link is a candidate (implicit link)", () => {
    const BACKLINK_BY_ITSELF = singleBacklinksPanelTest({
      testName: "THEN the backlink text is highlighted with an HTML span",
      noteBody: "foo",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 4,
          },
        },
      },
      match: ['<span style="color:#000;background-color:#FFFF00;">foo</span>'],
    });

    const WITH_OTHER_TEXT = singleBacklinksPanelTest({
      testName:
        "THEN text surrounding the wikilink on the same line is NOT highlighted",
      noteBody: "before foo after",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 8,
          },
          end: {
            line: 1,
            column: 11,
          },
        },
      },
      match: [
        'before <span style="color:#000;background-color:#FFFF00;">foo</span> after',
      ],
    });

    const WITH_FULL_NOTE_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN start and end of note markers are rendered if the context spans the entire note",
      noteBody: `-before
-before
-before
foo
-after
-after
-after`,
      backlinkHoverOpts: {
        linesOfContext: 5,
        location: {
          start: {
            line: 3,
            column: 1,
          },
          end: {
            line: 3,
            column: 4,
          },
        },
      },
      match: [
        "--- <i>Start of Note</i> ---",
        "-before",
        "--- <i>End of Note</i> ---",
        "-after",
      ],
    });

    const WITH_TRUNCATED_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN before and after line markers are rendered if the context does NOT span the entire note",
      noteBody: `-before
-before
-before
foo
-after
-after
-after`,
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 4,
            column: 1,
          },
          end: {
            line: 4,
            column: 4,
          },
        },
      },
      match: [
        "--- <i>Line 1</i> ---",
        "-before",
        "--- <i>Line 7</i> ---",
        "-after",
      ],
    });

    const WITH_TRUNCATED_CODE_BLOCKS_AS_CONTEXT = singleBacklinksPanelTest({
      testName:
        "THEN code blocks before and after that are truncated by the context limits still render properly",
      noteBody: `\`\`\`markdown
-before
-before
-before
\`\`\`
foo
\`\`\`markdown
-after
-after
-after
\`\`\``,
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 6,
            column: 1,
          },
          end: {
            line: 6,
            column: 4,
          },
        },
      },
      match: [
        "--- <i>Line 3</i> ---",
        "```markdown\n" +
          "-before\n" +
          "```\n" +
          "\n" +
          '<span style="color:#000;background-color:#FFFF00;">foo</span>\n' +
          "\n" +
          "```markdown\n" +
          "-after\n" +
          "```\n",
        "--- <i>Line 9</i> ---",
      ],
    });

    runAllTests({
      name: "THEN statements",
      testCases: [
        ...BACKLINK_BY_ITSELF,
        ...WITH_OTHER_TEXT,
        ...WITH_FULL_NOTE_CONTEXT,
        ...WITH_TRUNCATED_CONTEXT,
        ...WITH_TRUNCATED_CODE_BLOCKS_AS_CONTEXT,
      ],
    });
  });

  /**
   * Tests for Tags
   */
  describe("WHEN the link is a tag", () => {
    const USERTAG_BY_ITSELF = singleBacklinksPanelTest({
      testName: "THEN a usertag is highlighted with an HTML span",
      noteBody: "@johndoe",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 9,
          },
        },
      },
      match: [
        '<span style="color:#000;background-color:#FFFF00;">@johndoe</span>',
      ],
    });

    const HASHTAG_BY_ITSELF = singleBacklinksPanelTest({
      testName: "THEN a hashtag is highlighted with an HTML span",
      noteBody: "#sample",
      backlinkHoverOpts: {
        linesOfContext: 2,
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 8,
          },
        },
      },
      match: [
        '<span style="color:#000;background-color:#FFFF00;">#sample</span>',
      ],
    });

    runAllTests({
      name: "THEN statements",
      testCases: [...USERTAG_BY_ITSELF, ...HASHTAG_BY_ITSELF],
    });
  });
});
