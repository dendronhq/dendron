import {
  DEngineClientV2,
  DNoteRefLink,
  NotePropsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  AssertUtils,
  ENGINE_HOOKS,
  ENGINE_SERVER,
  NoteTestUtilsV4,
  runEngineTestV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { DendronASTData, DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { dendronPub } from "../dendronPub";
import { NoteRefsOpts } from "../noteRefs";
import { noteRefsV2 } from "../noteRefsV2";
import {
  createEngine,
  createProc,
  createProcTests,
  genDendronData,
  generateVerifyFunction,
  modifyNote,
  processText,
} from "./utils";

function proc(
  engine: DEngineClientV2,
  dendron: DendronASTData,
  opts?: NoteRefsOpts
) {
  return MDUtilsV4.proc({ engine })
    .data("dendron", dendron)
    .use(noteRefsV2, opts);
}

function createLink(opts: {
  fname: string;
  extra?: Partial<DNoteRefLink>;
}): { link: DNoteRefLink } {
  const { fname, extra } = opts;
  const out: { link: DNoteRefLink } = {
    link: {
      data: {
        type: "file",
      },
      from: {
        fname,
      },
      type: "ref",
    },
  };
  out.link = _.merge(out.link, extra);
  return out;
}

function checkLink(node: any, link: { link: DNoteRefLink }) {
  const refNode = node.children[0].children[0];
  expect(refNode.type).toEqual("refLinkV2");
  expect(refNode.data).toEqual(link);
}

describe("parse", () => {
  let engine: any;
  let dest: DendronASTDest.MD_REGULAR;

  test("init", () => {
    const resp = proc(engine, genDendronData({ dest })).parse(`![[foo.md]]))`);
    expect(resp).toMatchSnapshot();
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("refLinkV2");
  });

  test("without extension", () => {
    const resp = proc(engine, genDendronData({ dest })).parse(`![[foo]]))`);
    expect(resp).toMatchSnapshot();
    checkLink(resp, createLink({ fname: "foo" }));
  });

  test("with start anchor", () => {
    const resp = proc(engine, genDendronData({ dest })).parse(`![[foo#h1]]))`);
    expect(resp).toMatchSnapshot();
    checkLink(
      resp,
      createLink({
        fname: "foo",
        extra: {
          data: {
            type: "file",
            anchorStart: "h1",
          },
        },
      })
    );
  });

  test("with start and end", () => {
    const resp = proc(engine, genDendronData({ dest })).parse(
      `![[foo#h1:#h2]]))`
    );
    expect(resp).toMatchSnapshot();
    checkLink(
      resp,
      createLink({
        fname: "foo",
        extra: {
          data: {
            type: "file",
            anchorStart: "h1",
            anchorEnd: "h2",
          },
        },
      })
    );
  });

  test("init with inject", async () => {
    await runEngineTestV4(
      async ({ engine, vaults }) => {
        let _proc = proc(
          engine,
          genDendronData({ dest, vault: vaults[0] })
        ).use(dendronPub);
        const resp = _proc.parse(`![[foo.md]]`);
        expect(resp).toMatchSnapshot();
        const resp2 = _proc.runSync(resp);
        expect(resp2).toMatchSnapshot();
        return;
      },
      {
        expect,
        createEngine,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("doesn't parse inline code block", () => {
    const resp = proc(engine, genDendronData({ dest })).parse("`![[foo.md]]`");
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("inlineCode");
  });
});

describe("compilev2", () => {
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
      return { resp, proc };
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
      let proc = await createProc(opts, {});
      return processText({ proc, text: "# Foo Bar\n![[foo#header2]]" });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { respProcess } = extra;
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
            match: ["task2"],
            nomatch: ["task1"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { respProcess } = extra;
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
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
      let proc = await createProc(opts, { publishOpts: { insertTitle: true } });
      return processText({ proc, text: "# Foo Bar\n![[foo#header2]]" });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
        const { respProcess } = extra;
        expect(respProcess).toMatchSnapshot("bond");
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
            match: ["task2"],
            nomatch: ["task1"],
          })
        ).toBeTruthy();
      },
      //   [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
      //     const { respProcess } = extra;
      //     expect(
      //       await AssertUtils.assertInString({
      //         body: respProcess.toString(),
      //         match: ["![[foo#header2]]"],
      //       })
      //     ).toBeTruthy();
      //   },
      //   ...generateVerifyFunction({
      //     target: DendronASTDest.MD_REGULAR,
      //     exclude: [DendronASTDest.MD_DENDRON],
      //   }),
    },
  });

  const WITH_ANCHOR_WITH_SPACE = createProcTests({
    name: "WITH_ANCHOR",
    setupFunc: async (opts) => {
      let proc = await createProc(opts, {});
      return processText({ proc, text: "# Foo Bar\n![[foo#header-2]]" });
    },
    preSetupHook: ANCHOR_WITH_SPACE_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { respProcess } = extra;
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
            match: ["task2"],
            nomatch: ["task1"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { respProcess } = extra;
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
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
      let proc = await createProc(opts, {});
      return processText({ proc, text: "# Foo Bar\n![[foo#badheader]]" });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { respProcess } = extra;
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
            match: ["badheader not found"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { respParse, respProcess } = extra;
        expect(respParse).toMatchSnapshot();
        expect(respProcess).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
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
      let proc = await createProc(opts, {});
      return processText({
        proc,
        text: "# Foo Bar\n![[foo#header1:#badheader]]",
      });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { respProcess } = extra;
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
            match: ["badheader not found"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { respParse, respProcess } = extra;
        expect(respParse).toMatchSnapshot();
        expect(respProcess).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
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
      let proc = await createProc(opts, {});
      return processText({ proc, text: "# Foo Bar\n![[foo#header2,1]]" });
    },
    preSetupHook: WITH_ANCHOR_PRE_SETUP,
    verifyFuncDict: {
      [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
        const { respProcess } = extra;
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
            match: ["[[foo#header2,1]]"],
          })
        ).toBeTruthy();
      },
      [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
        const { respParse, respProcess } = extra;
        expect(respParse).toMatchSnapshot();
        expect(respProcess).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: respProcess.toString(),
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
        fname: "PLACEHOLDER",
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
        fname: "PLACEHOLDER",
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
        fname: "PLACEHOLDER",
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
  ];

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
