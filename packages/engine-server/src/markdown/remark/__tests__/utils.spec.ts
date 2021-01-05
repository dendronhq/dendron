import { NotePropsV2, WorkspaceOpts } from "@dendronhq/common-all";
import {
  AssertUtils,
  ENGINE_HOOKS,
  NoteTestUtilsV4,
  runEngineTestV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DendronASTDest, Processor } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { createEngine, createProcTests } from "./utils";

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
          expected: "![alt-text](bond/image-url.jpg)",
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
    const txt = `((ref: [[foo.md]]))`;
    if (opts.extra.dest === DendronASTDest.HTML) {
      const procRehype = MDUtilsV4.procRehype({ proc });
      const resp = await procRehype.process(txt);
      const respParse = await procRehype.parse(txt);
      const respTransform = await procRehype.run(respParse);
      return { resp, proc, respParse, respTransform };
    } else {
      const resp = await proc.process(txt);
      return { resp, proc };
    }
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async () => {},
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { resp, respParse, respTransform } = extra;
      expect(resp).toMatchSnapshot();
      expect(respParse).toMatchSnapshot();
      expect(respTransform).toMatchSnapshot();
      expect(
        await AssertUtils.assertInString({
          body: resp.contents,
          match: [
            // link by id
            `<a href=\"foo-id.html\"`,
            // html quoted
            `Foo.One</h1>`,
            `Foo.Two</h1>`,
          ],
        })
      ).toBeTruthy();
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async () => {},
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupNoteRefRecursive({
      ...opts,
      extra: { idv2: true },
    });
  },
});

const ALL_TEST_CASES = [
  ...WITH_ABBR,
  ...WITH_VARIABLE,
  ...WITH_ASSET_PREFIX,
  ...WITH_ASSET_PREFIX_UNDEFINED,
  ...NOTE_REF_BASIC_WITH_REHYPE,
  ...NOTE_REF_RECURSIVE_BASIC_WITH_REHYPE,
  ...WITH_TITLE,
  ...NOTE_W_LINK_AND_SPACE,
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
