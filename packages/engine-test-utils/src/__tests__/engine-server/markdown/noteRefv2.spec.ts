import {
  DendronConfig,
  NotePropsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  AssertUtils,
  ENGINE_HOOKS,
  ENGINE_SERVER,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import {
  checkNotInVFile,
  checkVFile,
  createProcTests,
  generateVerifyFunction,
  processTextV2,
} from "./utils";

// const proc = MDUtilsV4.procDendron;
// const createProc = MDUtilsV4.procDendron;

// function createLink(opts: {
//   fname: string;
//   extra?: Partial<DNoteRefLink>;
// }): { link: DNoteRefLink } {
//   const { fname, extra } = opts;
//   const out: { link: DNoteRefLink } = {
//     link: {
//       data: {
//         type: "file",
//       },
//       from: {
//         fname,
//       },
//       type: "ref",
//     },
//   };
//   out.link = _.merge(out.link, extra);
//   return out;
// }

// function checkLink(node: any, link: { link: DNoteRefLink }) {
//   const refNode = node.children[0].children[0];
//   expect(refNode.type).toEqual("refLinkV2");
//   expect(refNode.data).toEqual(link);
// }

export const modifyNote = async (
  opts: WorkspaceOpts,
  fname: string,
  cb: (note: NotePropsV2) => NotePropsV2
) => {
  await NoteTestUtilsV4.modifyNoteByPath(
    { wsRoot: opts.wsRoot, vault: opts.vaults[0], fname },
    cb
  );
};

// describe("parse", () => {
//     let engine: any;
//     let dest: DendronASTDest.MD_REGULAR;

//     test("init", () => {
//         const resp = proc({ engine, ...genDendronData({ dest }) }).parse(`![[foo.md]]))`);
//         expect(resp).toMatchSnapshot();
//         // @ts-ignore
//         expect(resp.children[0].children[0].type).toEqual("refLinkV2");
//     });

//     test("without extension", () => {
//         const resp = proc({engine, ...genDendronData({ dest })}).parse(`![[foo]]))`);
//         expect(resp).toMatchSnapshot();
//         checkLink(resp, createLink({ fname: "foo" }));
//     });

//     test("with start anchor", () => {
//         const resp = proc({engine, ...genDendronData({ dest })}).parse(`![[foo#h1]]))`);
//         expect(resp).toMatchSnapshot();
//         checkLink(
//             resp,
//             createLink({
//                 fname: "foo",
//                 extra: {
//                     data: {
//                         type: "file",
//                         anchorStart: "h1",
//                     },
//                 },
//             })
//         );
//     });

//     test("with start and end", () => {
//         const resp = proc({engine, ...genDendronData({ dest })}).parse(
//             `![[foo#h1:#h2]]))`
//         );
//         expect(resp).toMatchSnapshot();
//         checkLink(
//             resp,
//             createLink({
//                 fname: "foo",
//                 extra: {
//                     data: {
//                         type: "file",
//                         anchorStart: "h1",
//                         anchorEnd: "h2",
//                     },
//                 },
//             })
//         );
//     });

//     test("init with inject", async () => {
//         await runEngineTestV4(
//             async ({ engine, vaults }) => {
//                 let _proc = proc( engine, genDendronData({ dest, vault: vaults[0] })
//                 ).use(dendronPub);
//                 const resp = _proc.parse(`![[foo.md]]`);
//                 expect(resp).toMatchSnapshot();
//                 const resp2 = _proc.runSync(resp);
//                 expect(resp2).toMatchSnapshot();
//                 return;
//             },
//             {
//                 expect,
//                 createEngine,
//                 preSetupHook: ENGINE_HOOKS.setupBasic,
//             }
//         );
//     });

//     test("doesn't parse inline code block", () => {
//         const resp = proc(engine, genDendronData({ dest })).parse("`![[foo.md]]`");
//         // @ts-ignore
//         expect(resp.children[0].children[0].type).toEqual("inlineCode");
//     });
// });

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
    await modifyNote(opts, "foo", (note: NotePropsV2) => {
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
    await modifyNote(opts, "foo", (note: NotePropsV2) => {
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
      await modifyNote(opts, "foo.ch1", (note: NotePropsV2) => {
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
      // const resp = await proc(engine, {
      //   dest: extra.dest,
      //   vault: vaults[0],
      // }).process(note.body);
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

  describe("compile", () => {
    test.each(
      ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV5(testCase.testFunc, {
        expect,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
});
