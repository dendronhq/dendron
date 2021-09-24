import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  Processor,
  ProcFlavor,
} from "@dendronhq/engine-server";
import os from "os";
import path from "path";
import { ENGINE_HOOKS } from "../../../presets";
import { checkNotInString, checkString } from "../../../utils";
import { cleanVerifyOpts, createProcCompileTests } from "./utils";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";

const getOpts = (opts: any) => {
  const _copts = opts.extra as { proc: Processor; dest: DendronASTDest };
  return _copts;
};

describe("MDUtils.proc", () => {
  const IMAGE_WITH_LEAD_FORWARD_SLASH = createProcCompileTests({
    name: "IMAGE_WITH_LEAD_FORWARD_SLASH",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = `![foo alt txt](/assets/foo.jpg)`;
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.HTML]: {
        [ProcFlavor.REGULAR]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);
          await checkString(
            resp.contents,
            `<img src="/assets/foo.jpg" alt="foo alt txt">`
          );
        },
        [ProcFlavor.PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);

          // For platform test compat: b/c of fwd/backslash differences, on
          // Windows the path separators show up with %5C whereas linux/mac have
          // %2F.
          const fileNameToCheck =
            os.platform() === "win32" ? `assets%5Cfoo.jpg` : `assets%2Ffoo.jpg`;

          await checkString(resp.contents, fileNameToCheck, "localhost");
        },
        [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
      },
      [DendronASTDest.MD_REGULAR]: {
        [ProcFlavor.HOVER_PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);
          await checkString(
            resp.contents,
            `![foo alt txt](${path.join(
              opts.wsRoot,
              opts.vaults[0].fsPath,
              "/assets/foo.jpg"
            )})`
          );
        },
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
    },
  });
  const IMAGE_NO_LEAD_FORWARD_SLASH = createProcCompileTests({
    name: "IMAGE_NO_LEAD_FORWARD_SLASH",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = `![foo alt txt](assets/foo.jpg)`;
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.HTML]: {
        [ProcFlavor.REGULAR]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);
          await checkString(
            resp.contents,
            `<img src="assets/foo.jpg" alt="foo alt txt">`
          );
        },
        [ProcFlavor.PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);

          const fileNameToCheck =
            os.platform() === "win32" ? `assets%5Cfoo.jpg` : `assets%2Ffoo.jpg`;

          await checkString(resp.contents, fileNameToCheck, "localhost");
        },
        [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
      },
      [DendronASTDest.MD_REGULAR]: {
        [ProcFlavor.HOVER_PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);
          await checkString(
            resp.contents,
            `![foo alt txt](${path.join(
              opts.wsRoot,
              opts.vaults[0].fsPath,
              "/assets/foo.jpg"
            )})`
          );
        },
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
    },
  });
  const NOTE_REF_BASIC_WITH_REHYPE = createProcCompileTests({
    name: "NOTE_REF_WITH_REHYPE",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = `![[alpha.md]]`;
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.HTML]: {
        [ProcFlavor.REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          await checkString(
            resp.contents,
            // should have id for link
            `<a href="alpha-id.html"`,
            // html quoted
            `<p><a href="bar.html">Bar</a></p>`
          );
          await checkNotInString(
            resp.contents,
            // should not have title
            `Alpha<h1>`
          );
        },
        [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
        [ProcFlavor.PUBLISHING]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          await checkString(
            resp.contents,
            // should have id for link
            `<a href="/notes/alpha-id.html"`
          );
        },
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
      await NoteTestUtilsV4.createNote({
        fname: "alpha",
        body: "[[bar]]",
        vault: opts.vaults[0],
        wsRoot: opts.wsRoot,
        props: { id: "alpha-id" },
      });
    },
  });
  const NOTE_REF_MISSING = createProcCompileTests({
    name: "NOTE_REF_MISSING",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = `![[alpha.md]]`;
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.HTML]: {
        [ProcFlavor.REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkString(resp.contents, "No note with name alpha found");
        },
        [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
        [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
    },
  });

  const WILDCARD_NOTE_REF_MISSING = createProcCompileTests({
    name: "WILDCARD_NOTE_REF_MISSING",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = `![[alpha.*]]`;
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.HTML]: {
        [ProcFlavor.REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkString(
            resp.contents,
            "Error rendering note reference. There are no matches for"
          );
        },
        [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
        [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
    },
  });

  const WITH_FOOTNOTES = createProcCompileTests({
    name: "WITH_FOOTNOTES",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = [
        "Here is a footnote reference,[^1]",
        "",
        "[^1]: Here is the footnote.",
      ].join("\n");
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.HTML]: {
        [ProcFlavor.REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkString(
            resp.contents,
            `Here is the footnote.<a href="#fnref-1" class="footnote-backref">↩</a>`
          );
        },
        [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
        [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
    },
  });

  const ALL_TEST_CASES = [
    ...WITH_FOOTNOTES,
    ...IMAGE_NO_LEAD_FORWARD_SLASH,
    ...IMAGE_WITH_LEAD_FORWARD_SLASH,
    ...NOTE_REF_BASIC_WITH_REHYPE,
    ...NOTE_REF_MISSING,
    ...WILDCARD_NOTE_REF_MISSING,
  ];

  test.each(
    ALL_TEST_CASES.map((ent) => [
      `${ent.dest}: ${ent.name}: ${ent.flavor}`,
      ent.testCase,
    ])
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
      createEngine: createEngineFromServer,
    });
  });
});
