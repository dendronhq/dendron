import { NoteProps, NoteUtils, WorkspaceOpts } from "@dendronhq/common-all";
import {
  AssertUtils,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DConfig,
  DendronASTDest,
  MDUtilsV4,
  Processor,
  renderFromNote,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";
import {
  checkVFile,
  createProcTests,
  generateVerifyFunction,
  processText,
} from "./utils";

// --- Utils
const readAndProcess = (opts: { npath: string; proc: Processor }) => {
  const { npath, proc } = opts;
  const noteRaw = fs.readFileSync(npath, { encoding: "utf8" });
  const respParse = proc.parse(noteRaw);
  const respProcess = proc.processSync(noteRaw);
  const respRehype = MDUtilsV4.procRehype({ proc: proc() }).processSync(
    noteRaw
  );
  // expect(respParse).toMatchSnapshot("respParse");
  // expect(respProcess).toMatchSnapshot("respProcess");
  // expect(respRehype).toMatchSnapshot("respRehype");
  return { proc, respProcess, respParse, respRehype };
};

const readAndProcessV2 = (opts: { note: NoteProps; proc: Processor }) => {
  const { note, proc } = opts;
  const content = renderFromNote({ note });
  //const noteRaw = fs.readFileSync(npath, { encoding: "utf8" });
  const respParse = proc.parse(content);
  const respProcess = proc.processSync(content);
  const respRehype = MDUtilsV4.procRehype({ proc: proc() }).processSync(
    content
  );
  // expect(respParse).toMatchSnapshot("respParse");
  // expect(respProcess).toMatchSnapshot("respProcess");
  // expect(respRehype).toMatchSnapshot("respRehype");
  return { proc, respProcess, respParse, respRehype };
};

const modifyNote = async (
  opts: WorkspaceOpts,
  cb: (note: NoteProps) => NoteProps
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
    _.defaults(procOverride, {
      engine,
      dest: extra.dest,
      fname: "foo",
      vault: vaults[0],
      config: engine.config,
    })
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
    const { wsRoot, vaults, engine } = opts;
    let proc = await createProc(opts);
    //const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    const note = NoteUtils.getNoteByFnameV5({
      wsRoot,
      vault: vaults[0],
      fname: "foo",
      notes: engine.notes,
    });
    return readAndProcessV2({ note: note!, proc });
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
    await modifyNote(opts, (note: NoteProps) => {
      note.custom = { bond: 42 };
      note.body = `Title: {{fm.title}}. Bond: {{fm.bond}} Fname: {{fname}}`;
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
    await modifyNote(opts, (note: NoteProps) => {
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
    await modifyNote(opts, (note: NoteProps) => {
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
          match: [`Here is the footnote.<a class="fn" href="#fnref-1">˄</a>`],
        })
      ).toBeTruthy();
    },
    ...generateVerifyFunction({ target: DendronASTDest.HTML }),
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, (note: NoteProps) => {
      note.body = [
        "Here is a footnote reference,[^1]",
        "",
        "[^1]: Here is the footnote.",
      ].join("\n");
      return note;
    });
  },
});

const NOTE_REF_BASIC_WITH_REHYPE = createProcTests({
  name: "NOTE_REF_WITH_REHYPE",
  setupFunc: async (opts) => {
    let proc = await createProc(opts, {
      wikiLinksOpts: { useId: true },
    });

    const txt = `![[foo.md]]`;
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
            `<p><a href=\"bar.html\">Bar</a></p>`,
          ],
        })
      ).toBeTruthy();
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
    await modifyNote(opts, (note: NoteProps) => {
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
    await modifyNote(opts, (note: NoteProps) => {
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
    const txt2 = `![[foo.md]]`;
    const case2 = processText({ text: txt2, proc });
    return { case2 };
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { case2 } = extra;
      const { respRehype: resp2 } = case2;
      await Promise.all(
        [resp2].map((resp) => {
          checkVFile(
            resp,
            `<a href=\"foo-id.html\"`,
            // html quoted
            `Foo.One</h1>`,
            `Foo.Two</h1>`
          );
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
      await checkVFile(respProcess, "[Ch1](foo.ch1)");
    },
    [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkVFile(respProcess, "[[foo.ch1]]");
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkVFile(respProcess, "[Ch1](foo.ch1.md)");
    },
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respRehype } = extra;
      await checkVFile(respRehype, `<p><a href="foo.ch1.html">Ch1</a></p>`);
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, (note: NoteProps) => {
      note.body = `[[foo.ch1]]`;
      return note;
    });
  },
});

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
      await checkVFile(respProcess, "[Bar](bar)");
    },
    // [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
    //   const { respProcess } = extra;
    //   await checkVFile(respProcess, "[[dendron://vault2/bar]]");
    // },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkVFile(respProcess, `[Bar](../vault2/bar.md)`);
    },
    // [DendronASTDest.HTML]: async ({ extra }) => {
    //   const { respRehype } = extra;
    //   await checkVFile(respRehype, `<p><a href="bar.html">Bar</a></p>`);
    // },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
    await modifyNote(opts, (note: NoteProps) => {
      note.body = `[[dendron://vault2/bar]]`;
      return note;
    });
  },
});

const ALL_TEST_CASES = [
  ...WITH_ABBR,
  ...WITH_VARIABLE,
  // // --- note refs
  ...NOTE_REF_RECURSIVE_BASIC_WITH_REHYPE,
  ...NOTE_REF_BASIC_WITH_REHYPE,
  ...WITH_TITLE,
  ...NOTE_W_LINK_AND_SPACE,
  ...WITH_FOOTNOTES,
  ...WITH_MERMAID,
  ...WITH_TITLE_FOR_LINK,
  ...WITH_TITLE_FOR_LINK_X_VAULT,
];

describe("MDUtils.proc", () => {
  test.each(
    ALL_TEST_CASES.slice(0, 2).map((ent) => [
      `${ent.dest}: ${ent.name}`,
      ent.testCase,
    ])
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
    });
  });
});
