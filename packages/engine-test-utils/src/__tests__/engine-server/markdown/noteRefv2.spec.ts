import { DendronConfig, NoteProps, WorkspaceOpts } from "@dendronhq/common-all";
import {
  AssertUtils,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS, ENGINE_SERVER } from "../../../presets";
import {
  checkNotInVFile,
  checkVFile,
  createProcTests,
  generateVerifyFunction,
  processTextV2,
  ProcTests,
} from "./utils";

function runAllTests(opts: { name: string; testCases: ProcTests[] }) {
  const { name, testCases } = opts;
  describe(name, () => {
    test.each(
      testCases.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV5(testCase.testFunc, {
        expect,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
}

export const modifyNote = async (
  opts: WorkspaceOpts,
  fname: string,
  cb: (note: NoteProps) => NoteProps
) => {
  await NoteTestUtilsV4.modifyNoteByPath(
    { wsRoot: opts.wsRoot, vault: opts.vaults[0], fname },
    cb
  );
};

describe("legacy note ref", () => {
  const badRef = "((foo))";
  const BAD_REF = createProcTests({
    name: "BAD_REF",
    setupFunc: async ({ engine, vaults, extra }) => {
      const proc2 = await MDUtilsV4.procFull({
        config: {
          ...engine.config,
        },
        engine,
        fname: "foo",
        wikiLinksOpts: { useId: true },
        dest: extra.dest,
        vault: vaults[0],
      });
      const resp = await proc2.process(badRef);
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        checkVFile(resp, badRef);
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  runAllTests({ name: "compile", testCases: BAD_REF });
});

describe("noteRefV2", () => {
  const linkWithNoExtension = "![[foo]]";

  const REGULAR_CASE = createProcTests({
    name: "regular",
    setupFunc: async ({ engine, vaults, extra }) => {
      const proc2 = await MDUtilsV4.procFull({
        engine,
        fname: "foo",
        wikiLinksOpts: { useId: true },
        dest: extra.dest,
        vault: vaults[0],
      });
      const resp = await proc2.process(linkWithNoExtension);
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents,
            match: [linkWithNoExtension],
          })
        ).toBeTruthy();
      },
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
      [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
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

  const WITH_ANCHOR_PRE_SETUP = async (opts: WorkspaceOpts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, "foo", (note: NoteProps) => {
      const txt = [
        "---",
        "id: foo",
        "title: foo",
        "---",
        `# Tasks`,
        "## Header1",
        "task1",
        "## Header2",
        "task2",
      ];
      note.body = txt.join("\n");
      return note;
    });
  };

  const ANCHOR_WITH_SPACE_PRE_SETUP = async (opts: WorkspaceOpts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, "foo", (note: NoteProps) => {
      const txt = [
        "---",
        "id: foo",
        "---",
        `# Tasks`,
        "## Header 1",
        "task1",
        "## HeadeR 2",
        "task2",
      ];
      note.body = txt.join("\n");
      return note;
    });
  };

  const WITH_ANCHOR = createProcTests({
    name: "WITH_ANCHOR",
    setupFunc: async (opts) => {
      const text = "# Foo Bar\n![[foo#header2]]";
      return processTextV2({
        dest: opts.extra.dest,
        engine: opts.engine,
        text,
        fname: "foo",
        vault: opts.vaults[0],
      });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, "task2");
        await checkNotInVFile(resp, "task1");
      },
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["![[foo#header2]]"],
          })
        ).toBeTruthy();
      },
      ...generateVerifyFunction({
        target: DendronASTDest.MD_REGULAR,
        exclude: [DendronASTDest.MD_DENDRON],
      }),
    },
  });

  const WITH_FM_TITLE = createProcTests({
    name: "WITH_FM_TITLE",
    setupFunc: async (opts) => {
      const { engine, vaults } = opts;
      const configOverride: DendronConfig = {
        ...opts.engine.config,
        useFMTitle: true,
      };
      return processTextV2({
        text: "# Foo Bar\n![[foo#header2]]",
        dest: opts.extra.dest,
        engine,
        configOverride,
        vault: vaults[0],
        fname: "foo",
      });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot("bond");
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["task2"],
            nomatch: ["task1"],
          })
        ).toBeTruthy();
      },
    },
  });

  const WITH_NOTE_LINK_TITLE = createProcTests({
    name: "WITH_NOTE_LINK_TITLE",
    setupFunc: async (opts) => {
      const { engine, vaults } = opts;
      const configOverride: DendronConfig = {
        ...opts.engine.config,
        useNoteTitleForLink: true,
      };
      return processTextV2({
        text: "# Foo Bar\n![[foo.ch1#header2]]",
        dest: opts.extra.dest,
        engine,
        configOverride,
        vault: vaults[0],
        fname: "foo",
      });
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
      await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
        const txt = [`# Tasks`, "## Header1", "task1", "## Header2", "task2"];
        note.body = txt.join("\n");
        return note;
      });
    },
    verifyFuncDict: {
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, `<span class="portal-text-title">Ch1</span>`);
      },
      [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
        const { resp } = extra;
        await checkVFile(resp, `<span class="portal-text-title">Ch1</span>`);
      },
    },
  });

  const WITH_ANCHOR_WITH_SPACE = createProcTests({
    name: "WITH_ANCHOR_WITH_SPACE",
    setupFunc: async (opts) => {
      const { engine, vaults } = opts;
      return processTextV2({
        text: "# Foo Bar\n![[foo#header-2]]",
        dest: opts.extra.dest,
        engine,
        vault: vaults[0],
        fname: "foo",
      });
    },
    preSetupHook: ANCHOR_WITH_SPACE_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["task2"],
            nomatch: ["task1"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["![[foo#header-2]]"],
          })
        ).toBeTruthy();
      },
      ...generateVerifyFunction({
        target: DendronASTDest.MD_REGULAR,
        exclude: [DendronASTDest.MD_DENDRON],
      }),
    },
  });

  const WITH_START_ANCHOR_INVALID = createProcTests({
    name: "WITH_START_ANCHOR_INVALID",
    setupFunc: async (opts) => {
      const { engine, vaults } = opts;
      return processTextV2({
        text: "# Foo Bar\n![[foo#badheader]]",
        dest: opts.extra.dest,
        engine,
        vault: vaults[0],
        fname: "foo",
      });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["badheader not found"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["![[foo#badheader]]"],
          })
        ).toBeTruthy();
      },
      ...generateVerifyFunction({
        target: DendronASTDest.MD_REGULAR,
        exclude: [DendronASTDest.MD_DENDRON],
      }),
    },
  });

  const WITH_END_ANCHOR_INVALID = createProcTests({
    name: "WITH_END_ANCHOR_INVALID",
    setupFunc: async (opts) => {
      const { engine, vaults } = opts;
      return processTextV2({
        text: "# Foo Bar\n![[foo#header1:#badheader]]",
        dest: opts.extra.dest,
        engine,
        vault: vaults[0],
        fname: "foo",
      });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["badheader not found"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["![[foo#header1:#badheader]]"],
          })
        ).toBeTruthy();
      },
      ...generateVerifyFunction({
        target: DendronASTDest.MD_REGULAR,
        exclude: [DendronASTDest.MD_DENDRON],
      }),
    },
  });

  const WITH_START_ANCHOR_OFFSET = createProcTests({
    name: "WITH_START_ANCHOR_OFFSET",
    setupFunc: async (opts) => {
      // let proc = await createProc(opts, {});
      // return processText({ proc, text: "# Foo Bar\n![[foo#header2,1]]" });
      const { engine, vaults } = opts;
      return processTextV2({
        text: "# Foo Bar\n![[foo#header2,1]]",
        dest: opts.extra.dest,
        engine,
        vault: vaults[0],
        fname: "foo",
      });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["[[foo#header2,1]]"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        expect(
          await AssertUtils.assertInString({
            body: resp.toString(),
            match: ["task2"],
            nomatch: ["Header2", "task1"],
          })
        ).toBeTruthy();
      },
      ...generateVerifyFunction({
        target: DendronASTDest.MD_REGULAR,
        exclude: [DendronASTDest.MD_DENDRON],
      }),
    },
  });

  const RECURSIVE_TEST_CASES = createProcTests({
    name: "recursive",
    setupFunc: async ({ engine, extra, vaults }) => {
      const resp = await MDUtilsV4.procFull({
        engine,
        dest: extra.dest,
        vault: vaults[0],
        fname: "root",
      }).process(linkWithNoExtension);
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents,
            match: [linkWithNoExtension],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["# Foo", "# Foo.One", "# Foo.Two", "Regular wikilink"],
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
              match: [
                "# Foo",
                "# Foo.One",
                "# Foo.Two",
                "portal",
                "Regular wikilink",
              ],
            }),
            expected: true,
          },
        ];
      },
      [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
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

  // const RECURSIVE_TOO_DEEP_TEST_CASES = createProcTests({
  //   name: "RECURSIVE_TOO_DEEP_TEST_CASES",
  //   setupFunc: async ({ engine, extra, vaults }) => {
  //     const resp = await MDUtilsV4.procFull({
  //       engine,
  //       dest: extra.dest,
  //       vault: vaults[0],
  //     }).process(linkWithNoExtension);
  //     return { resp };
  //   },
  //   verifyFuncDict: {
  //     [DendronASTDest.HTML]: async ({ extra }) => {
  //       const { resp } = extra;
  //       expect(resp).toMatchSnapshot();
  //       return [
  //         {
  //           actual: await AssertUtils.assertInString({
  //             body: resp.toString(),
  //             match: [
  //               "# Foo",
  //               "# Foo.One",
  //               "# Foo.Two",
  //               "portal",
  //               "Regular wikilink",
  //             ],
  //           }),
  //           expected: true,
  //         },
  //       ];
  //     },
  //   },
  //   preSetupHook: async(opts) => {
  //     const {wsRoot, vaults} = opts;
  //     const vault = vaults[0];
  //     await NoteTestUtilsV4.createNote({fname: "foo", wsRoot, vault, body: "# Head1\n![[foo]]"})
  //   },
  // });

  const WILDCARD_CASE = createProcTests({
    name: "wildcard",
    setupFunc: async ({ engine, extra, vaults }) => {
      const note = engine.notes["id.journal"];
      const resp = await MDUtilsV4.procFull({
        engine,
        dest: extra.dest,
        vault: vaults[0],
        fname: "root",
      }).process(note.body);
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra, engine }) => {
        const note = engine.notes["id.journal"];
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents,
            match: [note.body],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_REGULAR]: async ({ extra, engine }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        // @ts-ignore
        return ENGINE_SERVER.NOTE_REF.WILDCARD_LINK_V4.genTestResults!({
          engine,
          extra: { body: resp.toString() },
        });
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
      },
      [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
      },
    },
    preSetupHook: ENGINE_SERVER.NOTE_REF.WILDCARD_LINK_V4.preSetupHook,
  });
  const XVAULT_CASE = createProcTests({
    name: "XVAULT_CASE",
    setupFunc: async ({ engine, extra, vaults }) => {
      const note = engine.notes["one"];
      const resp = await MDUtilsV4.procFull({
        engine,
        dest: extra.dest,
        vault: vaults[0],
        fname: "root",
      }).process(note.body);
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra, engine }) => {
        const note = engine.notes["one"];
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents,
            match: [note.body],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        // should have contents
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents,
            match: ["two content"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents,
            match: ["two content"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents,
            match: ["two content"],
          })
        ).toBeTruthy();
      },
    },
    preSetupHook: async ({ wsRoot, vaults }) => {
      const vault1 = vaults[0];
      const vault2 = vaults[1];
      await NoteTestUtilsV4.createNote({
        fname: "one",
        vault: vault1,
        wsRoot,
        body: "![[dendron://vault2/two]]",
      });
      await NoteTestUtilsV4.createNote({
        fname: "two",
        vault: vault2,
        wsRoot,
        body: "two content",
      });
    },
  });

  const ALL_TEST_CASES = [
    // ...RECURSIVE_TOO_DEEP_TEST_CASES,
    ...REGULAR_CASE,
    ...RECURSIVE_TEST_CASES,
    ...WILDCARD_CASE,
    ...WITH_ANCHOR,
    ...WITH_FM_TITLE,
    ...WITH_ANCHOR_WITH_SPACE,
    ...WITH_START_ANCHOR_INVALID,
    ...WITH_END_ANCHOR_INVALID,
    ...WITH_START_ANCHOR_OFFSET,
    ...XVAULT_CASE,
    ...WITH_NOTE_LINK_TITLE,
  ];

  // const ALL_TEST_CASES = [
  //     ...WITH_ANCHOR
  // ];

  runAllTests({ name: "compile", testCases: ALL_TEST_CASES });

  describe.only("with block anchors", () => {
    const IN_PARAGRAPH = createProcTests({
      name: "in paragraph",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "",
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non. ^block-anchor",
            "",
            "Soluta ex qui.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non.",
            "Soluta ex qui."
          );
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia."
          );
        },
      },
    });

    const AFTER_PARAGRAPH = createProcTests({
      name: "immediately after a paragraph",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "",
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non.",
            "^block-anchor",
            "",
            "Soluta ex qui.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non.",
            "Soluta ex qui."
          );
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia."
          );
        },
      },
    });

    const AFTER_PARAGRAPH_BLOCK = createProcTests({
      name: "after a paragraph block",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "",
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non.",
            "",
            "^block-anchor",
            "",
            "Soluta ex qui.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non.",
            "Soluta ex qui."
          );
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia."
          );
        },
      },
    });

    /** When the anchor is on a list element, it only references that element. */
    const LIST_ELEMENT = createProcTests({
      name: "list element",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Sapiente sed accusamus eum.",
            "* Ullam optio est quia.",
            "* Reprehenderit doloribus. ^block-anchor",
            "* Sint minus fuga omnis non.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Reprehenderit doloribus.");
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "Sint minus fuga omnis non."
          );
        },
      },
    });

    /** When the anchor is immediately after the last list element, it only references the last element. */
    const AFTER_LIST = createProcTests({
      name: "immediately after last list element",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Sapiente sed accusamus eum.",
            "* Ullam optio est quia.",
            "* Reprehenderit doloribus.",
            "* Sint minus fuga omnis non.",
            "^block-anchor",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Sint minus fuga omnis non.");
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "Reprehenderit doloribus."
          );
        },
      },
    });

    /** When the anchor is after the list and there is some space in between, it references the whole list. */
    const AFTER_LIST_BLOCK = createProcTests({
      name: "after list block",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Laborum libero quia ducimus.",
            "",
            "* Sapiente sed accusamus eum.",
            "* Ullam optio est quia.",
            "",
            "^block-anchor",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sint minus fuga omnis non.",
            "Ullam optio est quia."
          );
          await checkNotInVFile(
            resp,
            "Laborum libero quia ducimus.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** When the anchor is anywhere in or after a table, it references the whole table. */
    const IN_TABLE = createProcTests({
      name: "in table",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Minima expedita vero.",
            "",
            "| Sapiente | accusamus |",
            "|----------|-----------|",
            "| Laborum  | libero    | ^block-anchor",
            "| Ullam    | optio     |",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente",
            "accusamus",
            "Laborum",
            "libero",
            "Ullam",
            "optio"
          );
          await checkNotInVFile(
            resp,
            "Minima expedita vero.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** When the anchor is anywhere in or after a table, it references the whole table. */
    const AFTER_TABLE = createProcTests({
      name: "after table",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Laborum libero quia ducimus.",
            "",
            "| Sapiente | accusamus |",
            "|----------|-----------|",
            "| Laborum  | libero    |",
            "| Ullam    | optio     |",
            "^block-anchor",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente",
            "accusamus",
            "Laborum",
            "libero",
            "Ullam",
            "optio"
          );
          await checkNotInVFile(
            resp,
            "Minima expedita vero.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** When the anchor is anywhere in or after a table, it references the whole table. */
    const AFTER_TABLE_BLOCK = createProcTests({
      name: "after table block",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Laborum libero quia ducimus.",
            "",
            "| Sapiente | accusamus |",
            "|----------|-----------|",
            "| Laborum  | libero    |",
            "| Ullam    | optio     |",
            "",
            "^block-anchor",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente",
            "accusamus",
            "Laborum",
            "libero",
            "Ullam",
            "optio"
          );
          await checkNotInVFile(
            resp,
            "Minima expedita vero.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    runAllTests({
      name: "compile",
      testCases: [
        ...LIST_ELEMENT,
        ...AFTER_LIST,
        ...AFTER_LIST_BLOCK,
        ...IN_TABLE,
        ...AFTER_TABLE,
        ...AFTER_TABLE_BLOCK,
      ],
    });
    runAllTests({
      name: "compile",
      testCases: [
        ...IN_PARAGRAPH,
        ...AFTER_PARAGRAPH,
        ...AFTER_PARAGRAPH_BLOCK,
        ...LIST_ELEMENT,
        ...AFTER_LIST,
        ...AFTER_LIST_BLOCK,
        ...IN_TABLE,
        ...AFTER_TABLE,
        ...AFTER_TABLE_BLOCK,
      ],
    });
  });
});
