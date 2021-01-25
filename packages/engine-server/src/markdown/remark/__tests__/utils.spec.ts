import { NotePropsV2, WorkspaceOpts } from "@dendronhq/common-all";
import {
  AssertUtils,
  ENGINE_HOOKS,
  ENGINE_HOOKS_MULTI,
  NoteTestUtilsV4,
  runEngineTestV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DendronASTDest, Processor } from "../../types";
import { DConfig } from "../../../config";
import {
  checkContents,
  createEngine,
  createProcTests,
  generateVerifyFunction,
  processText,
} from "./utils";
import { MDUtilsV4 } from "../../utils";

const IMAGE_LINK = `![alt-text](image-url.jpg)`;

// --- Utils
const readAndProcess = (opts: { npath: string; proc: Processor }) => {
  const { npath, proc } = opts;
  const noteRaw = fs.readFileSync(npath, { encoding: "utf8" });
  const respParse = proc.parse(noteRaw);
  const respProcess = proc.processSync(noteRaw);
  const respRehype = MDUtilsV4.procRehype({ proc: proc() }).processSync(
    noteRaw
  );
  expect(respParse).toMatchSnapshot("respParse");
  expect(respProcess).toMatchSnapshot("respProcess");
  expect(respRehype).toMatchSnapshot("respRehype");
  return { proc, respProcess, respParse, respRehype };
};

const modifyNote = async (
  opts: WorkspaceOpts,
  cb: (note: NotePropsV2) => NotePropsV2
) => {
  await NoteTestUtilsV4.modifyNoteByPath(
    { wsRoot: opts.wsRoot, vault: opts.vaults[0], fname: "foo" },
    cb
  );
};

const createProc = async (
  opts: Parameters<TestPresetEntryV4["testFunc"]>[0],
  procOverride?: Partial<Parameters<typeof MDUtilsV4.procFull>[0]>
) => {
  const { engine, vaults, extra } = opts;
  const proc = await MDUtilsV4.procFull(
    _.defaults(
      {
        engine,
        dest: extra.dest,
        fname: "foo",
        vault: vaults[0],
      },
      procOverride
    )
  );
  return proc;
};

// --- Test Cases

const WITH_TITLE = createProcTests({
  name: "WITH_TITLE",
  setupFunc: async (opts) => {
    let proc = await createProc(opts, {
      publishOpts: {
        insertTitle: true,
      },
    });
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcess({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { respProcess } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respProcess.contents,
          match: ["# Foo", "foo body"],
        })
      ).toBeTruthy();
    },
  },
  preSetupHook: ENGINE_HOOKS.setupBasic,
});

const WITH_VARIABLE = createProcTests({
  name: "WITH_VARIABLE",
  setupFunc: async (opts) => {
    let proc = await createProc(opts);
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcess({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { respProcess, respRehype } = extra;
      Promise.all(
        [respProcess, respRehype].map(async (ent) => {
          expect(
            await AssertUtils.assertInString({
              body: ent.contents,
              match: ["Title: Foo", "Bond: 42"],
            })
          ).toBeTruthy();
        })
      );
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: DendronASTDest.MD_REGULAR,
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, (note: NotePropsV2) => {
      note.custom = { bond: 42 };
      note.body = `Title: {{fm.title}}. Bond: {{fm.bond}}`;
      return note;
    });
  },
});

const WITH_ABBR = createProcTests({
  name: "WITH_ABBR",
  setupFunc: async (opts) => {
    let proc = await createProc(opts);
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcess({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respRehype } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respRehype.contents,
          match: [
            `<p>This plugin works on <abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>, a Markdown <abbr title="Abstract syntax tree">AST</abbr> implemented by <a href="https://github.com/remarkjs/remark">remark</a></p>`,
          ],
        })
      ).toBeTruthy();
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, (note: NotePropsV2) => {
      note.body = [
        "This plugin works on MDAST, a Markdown AST implemented by [remark](https://github.com/remarkjs/remark)",
        "",
        "*[MDAST]: Markdown Abstract Syntax Tree",
        "*[AST]: Abstract syntax tree",
      ].join("\n");
      return note;
    });
  },
});

const WITH_MERMAID = createProcTests({
  name: "WITH_MERMAID",
  setupFunc: async (opts) => {
    let proc = await createProc(opts);
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcess({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respRehype } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respRehype.contents,
          match: [
            `<h1 id="mermaid-code-block"><a aria-hidden="true" class="anchor-heading" href="#mermaid-code-block"><svg aria-hidden="true" viewBox="0 0 16 16"><use xlink:href="#svg-link"></use></svg></a>mermaid code block</h1>`,
          ],
        })
      ).toBeTruthy();
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, (note: NotePropsV2) => {
      note.body = `
# mermaid code block

\`\`\`mermaid
graph LR
Start --> Stop
\`\`\`
`;
      return note;
    });
  },
});

const WITH_FOOTNOTES = createProcTests({
  name: "WITH_FOOTNOTES",
  setupFunc: async (opts) => {
    let proc = await createProc(opts);
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcess({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respRehype, respProcess } = extra;
      expect(respProcess).toMatchSnapshot();
      expect(
        await AssertUtils.assertInString({
          body: respRehype.contents,
          match: [
            `Here is the footnote.<a href="#fnref-1" class="footnote-backref">↩</a>`,
          ],
        })
      ).toBeTruthy();
    },
    ...generateVerifyFunction({ target: DendronASTDest.HTML }),
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, (note: NotePropsV2) => {
      note.body = [
        "Here is a footnote reference,[^1]",
        "",
        "[^1]: Here is the footnote.",
      ].join("\n");
      return note;
    });
  },
});

const WITH_ASSET_PREFIX_UNDEFINED = createProcTests({
  name: "asset_prefix undefined",
  setupFunc: async (opts) => {
    let proc = await createProc(opts, {
      publishOpts: {
        assetsPrefix: undefined,
      },
    });
    const resp = proc.processSync(IMAGE_LINK);
    return { resp, proc };
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot();
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](image-url.jpg)",
        },
      ];
    },
    [DendronASTDest.HTML]: DendronASTDest.MD_REGULAR,
    [DendronASTDest.MD_ENHANCED_PREVIEW]: DendronASTDest.MD_REGULAR,
  },
  preSetupHook: ENGINE_HOOKS.setupBasic,
});

const WITH_ASSET_PREFIX = createProcTests({
  name: "asset_prefix",
  setupFunc: async (opts) => {
    let proc = await createProc(opts, {
      publishOpts: {
        assetsPrefix: "bond/",
      },
    });
    const resp = proc.processSync(IMAGE_LINK);
    return { resp, proc };
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot();
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](image-url.jpg)",
        },
      ];
    },
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot();
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](/bond/image-url.jpg)",
        },
      ];
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: DendronASTDest.MD_REGULAR,
  },
  preSetupHook: ENGINE_HOOKS.setupBasic,
});

const NOTE_REF_BASIC_WITH_REHYPE = createProcTests({
  name: "NOTE_REF_WITH_REHYPE",
  setupFunc: async (opts) => {
    let proc = await createProc(opts, {
      wikiLinksOpts: { useId: true },
    });

    const txt = `((ref: [[foo.md]]))`;
    if (opts.extra.dest === DendronASTDest.HTML) {
      const procRehype = MDUtilsV4.procRehype({ proc });
      const resp = await procRehype.process(txt);
      return { resp, proc };
    } else {
      const resp = await proc.process(txt);
      return { resp, proc };
    }
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async () => {},
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot("respRehype");
      expect(
        await AssertUtils.assertInString({
          body: resp.contents,
          match: [
            // link by id
            `<a href=\"foo-id.html\"`,
            // html quoted
            `<p><a href=\"bar.html\">bar</a></p>`,
          ],
        })
      ).toBeTruthy();
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
    await modifyNote(opts, (note: NotePropsV2) => {
      note.body = `[[bar]]`;
      return note;
    });
  },
});

const NOTE_W_LINK_AND_SPACE = createProcTests({
  name: "NOTE_W_LINK_AND_SPACE",
  setupFunc: async (opts) => {
    let proc = await createProc(opts);
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcess({ npath, proc });
  },
  verifyFuncDict: {
    // NOTE: this shouldn't hapen since publishing should always be by id...
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respRehype } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respRehype.contents,
          match: [`<a href=\"foo bar.html\"`],
        })
      ).toBeTruthy();
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
    await modifyNote(opts, (note: NotePropsV2) => {
      note.body = `[[foo bar]]`;
      return note;
    });
  },
});

const NOTE_REF_RECURSIVE_BASIC_WITH_REHYPE = createProcTests({
  name: "NOTE_REF_RECURSIVE_WITH_REHYPE",
  setupFunc: async (opts) => {
    let proc = await createProc(opts, {
      wikiLinksOpts: { useId: true },
    });
    const txt1 = `((ref: [[foo.md]]))`;
    const txt2 = `![[foo.md]]`;
    const case1 = processText({ text: txt1, proc });
    const case2 = processText({ text: txt2, proc });
    return { case1, case2 };
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { case1, case2 } = extra;
      const { respRehype: resp1 } = case1;
      const { respRehype: resp2 } = case2;
      await Promise.all(
        [resp1, resp2].map((resp) => {
          return checkContents(resp, [
            // link by id
            `<a href=\"foo-id.html\"`,
            // html quoted
            `Foo.One</h1>`,
            `Foo.Two</h1>`,
          ]);
        })
      );
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupNoteRefRecursive({
      ...opts,
      extra: { idv2: true },
    });
  },
});

const WITH_TITLE_FOR_LINK = createProcTests({
  name: "WITH_TITLE_FOR_LINK",
  setupFunc: async (opts) => {
    let proc = await createProc(opts, {
      config: { ...DConfig.genDefaultConfig(), useNoteTitleForLink: true },
    });
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcess({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkContents(respProcess, "[Ch1](foo.ch1)");
    },
    [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkContents(respProcess, "[[foo.ch1]]");
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkContents(respProcess, "[Ch1](foo.ch1.md)");
    },
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respRehype } = extra;
      await checkContents(respRehype, `<p><a href="foo.ch1.html">Ch1</a></p>`);
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, (note: NotePropsV2) => {
      note.body = `[[foo.ch1]]`;
      return note;
    });
  },
});

// @ts-ignore
const WITH_TITLE_FOR_LINK_X_VAULT = createProcTests({
  name: "WITH_TITLE_FOR_LINK_X_VAULT",
  setupFunc: async (opts) => {
    let proc = await createProc(opts, {
      config: { ...DConfig.genDefaultConfig(), useNoteTitleForLink: true },
    });
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcess({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkContents(respProcess, "[Bar](bar)");
    },
    [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkContents(respProcess, "[[vault2/bar]]");
    },
    // TODO
    // [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
    //   const { respProcess } = extra;
    //   await checkContents(respProcess, "[Ch1](foo.ch1.md)");
    // },
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respRehype } = extra;
      await checkContents(respRehype, `<p><a href="bar.html">Bar</a></p>`);
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
    await modifyNote(opts, (note: NotePropsV2) => {
      note.body = `[[vault2/bar]]`;
      return note;
    });
  },
});

const ALL_TEST_CASES = [
  ...WITH_ABBR,
  ...WITH_VARIABLE,
  ...WITH_ASSET_PREFIX,
  ...WITH_ASSET_PREFIX_UNDEFINED,
  // --- note refs
  ...NOTE_REF_RECURSIVE_BASIC_WITH_REHYPE,
  ...NOTE_REF_BASIC_WITH_REHYPE,
  ...WITH_TITLE,
  ...NOTE_W_LINK_AND_SPACE,
  ...WITH_FOOTNOTES,
  ...WITH_MERMAID,
  ...WITH_TITLE_FOR_LINK,
  //...WITH_TITLE_FOR_LINK_X_VAULT,
];

describe("MDUtils.proc", () => {
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
