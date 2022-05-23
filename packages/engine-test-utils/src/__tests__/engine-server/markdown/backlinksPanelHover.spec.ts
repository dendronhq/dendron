import { NoteProps, ProcFlavor, WorkspaceOpts } from "@dendronhq/common-all";
import {
  AssertUtils,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  MDUtilsV5,
  BacklinkOpts,
} from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { createProcTests, ProcTests } from "./utils";

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
  return createProcTests({
    name: testName,
    setupFunc: async ({ engine, vaults, extra }) => {
      const proc = MDUtilsV5.procRemarkFull(
        {
          engine,
          fname: "foo",
          wikiLinksOpts: { useId: true },
          dest: extra.dest,
          vault: vaults[0],
          backlinkHoverOpts,
        },
        {
          flavor: ProcFlavor.BACKLINKS_PANEL_HOVER,
        }
      );
      const resp = await proc.process(noteBody);
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
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
            column: 1,
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
        "--- <i>Start of Note<i/> ---",
        "-before",
        "--- <i>End of Note<i/> ---",
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
        "--- <i>Line 1<i/> ---",
        "-before",
        "--- <i>Line 7<i/> ---",
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
        "--- <i>Line 3<i/> ---",
        "```markdown\n" +
          "-before\n" +
          "```\n" +
          "\n" +
          '<span style="color:#000;background-color:#FFFF00;">[[foo]]</span>\n' +
          "\n" +
          "```markdown\n" +
          "-after\n" +
          "```\n",
        "--- <i>Line 9<i/> ---",
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
   * Tests for Note Refs
   */
  describe("WHEN the link is a note ref", () => {
    const BACKLINK_BY_ITSELF = singleBacklinksPanelTest({
      testName: "THEN the backlink text is highlighted with an HTML span",
      noteBody: "![[foo]]",
      backlinkHoverOpts: {
        // backLinkLineNumber: 1,
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
        "--- <i>Start of Note<i/> ---",
        "-before",
        "--- <i>End of Note<i/> ---",
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
        "--- <i>Line 1<i/> ---",
        "-before",
        "--- <i>Line 7<i/> ---",
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
        "--- <i>Line 3<i/> ---",
        "```markdown\n" +
          "-before\n" +
          "```\n" +
          "\n" +
          '<span style="color:#000;background-color:#FFFF00;">![[foo]]</span>\n' +
          "\n" +
          "```markdown\n" +
          "-after\n" +
          "```\n",
        "--- <i>Line 9<i/> ---",
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
   * Tests for Link Candidates
   */
  describe("WHEN the link is a candidate (implicit link)", () => {
    const BACKLINK_BY_ITSELF = singleBacklinksPanelTest({
      testName: "THEN the backlink text is highlighted with an HTML span",
      noteBody: "foo",
      backlinkHoverOpts: {
        // backLinkLineNumber: 1,
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
        "--- <i>Start of Note<i/> ---",
        "-before",
        "--- <i>End of Note<i/> ---",
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
        "--- <i>Line 1<i/> ---",
        "-before",
        "--- <i>Line 7<i/> ---",
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
        "--- <i>Line 3<i/> ---",
        "```markdown\n" +
          "-before\n" +
          "```\n" +
          "\n" +
          '<span style="color:#000;background-color:#FFFF00;">foo</span>\n' +
          "\n" +
          "```markdown\n" +
          "-after\n" +
          "```\n",
        "--- <i>Line 9<i/> ---",
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
});
