import {
  ConfigUtils,
  NoteProps,
  NoteUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  AssertUtils,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  MDUtilsV5,
  Processor,
  renderFromNote,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";
import { checkVFile, createProcTests } from "./utils";

async function processText({ text, proc }: { text: string; proc: Processor }) {
  const respParse = proc.parse(text);
  const respRun = await proc.run(respParse);
  const respProcess = proc.stringify(respRun);
  return { proc, respProcess, respRun, respParse };
}

function readAndProcessFile(opts: { npath: string; proc: Processor }) {
  const { npath, proc } = opts;
  const text = fs.readFileSync(npath, { encoding: "utf8" });
  return processText({ text, proc });
}

function readAndProcessNote(opts: { note: NoteProps; proc: Processor }) {
  const { note, proc } = opts;
  const text = renderFromNote({ note });
  return processText({ text, proc });
}

async function modifyNote(
  opts: WorkspaceOpts,
  cb: (note: NoteProps) => NoteProps
) {
  await NoteTestUtilsV4.modifyNoteByPath(
    { wsRoot: opts.wsRoot, vault: opts.vaults[0], fname: "foo" },
    cb
  );
}

async function createProc(
  opts: Parameters<TestPresetEntryV4["testFunc"]>[0],
  procOverride?: Partial<Parameters<typeof MDUtilsV5.procRemarkFull>[0]>
) {
  const { engine, vaults, extra } = opts;
  const procData = _.defaults(procOverride, {
    engine,
    dest: extra.dest,
    fname: "foo",
    vault: vaults[0],
    config: engine.config,
  });
  if (procData.dest === DendronASTDest.HTML) {
    return MDUtilsV5.procRehypeFull(procData);
  } else {
    return MDUtilsV5.procRemarkFull(procData);
  }
}

// --- Test Cases

const WITH_TITLE = createProcTests({
  name: "WITH_TITLE",
  setupFunc: async (opts) => {
    const proc = await createProc(opts, {
      publishOpts: {
        insertTitle: true,
      },
    });
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcessFile({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { respProcess } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respProcess,
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
    const { vaults, engine } = opts;
    const proc = await createProc(opts);
    //const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    const note = NoteUtils.getNoteByFnameFromEngine({
      vault: vaults[0],
      fname: "foo",
      engine,
    });
    return readAndProcessNote({ note: note!, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { respProcess } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respProcess,
          match: ["Title: Foo", "Bond: 42"],
        })
      ).toBeTruthy();
    },
    [DendronASTDest.HTML]: DendronASTDest.MD_REGULAR,
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
    const proc = await createProc(opts);
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcessFile({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respProcess } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respProcess,
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
    const proc = await createProc({ ...opts });
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcessFile({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respProcess } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respProcess,
          match: [`<div class="mermaid">`],
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
    const proc = await createProc(opts);
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcessFile({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respProcess } = extra;
      expect(respProcess).toMatchSnapshot();
      expect(
        await AssertUtils.assertInString({
          body: respProcess,
          match: [`Here is the footnote.<a class="fn" href="#fnref-1">˄</a>`],
        })
      ).toBeTruthy();
    },
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
    const proc = await createProc(opts, {
      wikiLinksOpts: { useId: true },
    });

    const text = `![[foo.md]]`;
    return processText({ text, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respProcess } = extra;
      expect(respProcess).toMatchSnapshot("respProcess");
      expect(
        await AssertUtils.assertInString({
          body: respProcess,
          match: [
            // link by id
            `<a href="foo-id"`,
            // html quoted
            `<p><a href="bar">Bar</a></p>`,
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
    const proc = await createProc(opts);
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcessFile({ npath, proc });
  },
  verifyFuncDict: {
    // NOTE: this shouldn't hapen since publishing should always be by id...
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respProcess } = extra;
      expect(
        await AssertUtils.assertInString({
          body: respProcess,
          match: [`<a href="foo bar"`],
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
    const proc = await createProc(opts, {
      wikiLinksOpts: { useId: true },
    });
    const text = `![[foo.md]]`;
    return processText({ text, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkVFile(
        respProcess,
        `<a href="foo-id"`,
        // html quoted
        `Foo.One</h1>`,
        `Foo.Two</h1>`
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
    const proc = await createProc(opts, {
      config: { ...ConfigUtils.genDefaultConfig(), useNoteTitleForLink: true },
    });
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcessFile({ npath, proc });
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
      const { respProcess } = extra;
      await checkVFile(respProcess, `<p><a href="foo.ch1">Ch1</a></p>`);
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
    const proc = await createProc(opts, {
      config: { ...ConfigUtils.genDefaultConfig(), useNoteTitleForLink: true },
    });
    const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
    return readAndProcessFile({ npath, proc });
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkVFile(respProcess, "[Bar](bar)");
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
      const { respProcess } = extra;
      await checkVFile(
        respProcess,
        `[Bar](${path.join("..", "vault2", "bar.md")})`
      );
    },
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
    ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
    // @ts-ignore
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
    });
  });
});
