import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import {
  AnchorUtils,
  DendronASTDest,
  Processor,
  ProcFlavor,
} from "@dendronhq/unified";
import path from "path";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkString } from "../../../utils";
import { cleanVerifyOpts, createProcCompileTests } from "./utils";

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
        [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
        [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
      },
      [DendronASTDest.MD_REGULAR]: {
        [ProcFlavor.HOVER_PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);
          await checkString(
            resp.contents.toLowerCase(), // Do a case-invariant comparison here because of windows c:// vs C://
            `![foo alt txt](${path.join(
              opts.wsRoot,
              opts.vaults[0].fsPath,
              "/assets/foo.jpg"
            )})`.toLowerCase()
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
            `<img src="/assets/foo.jpg" alt="foo alt txt">`
          );
        },
        [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
        [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
      },
      [DendronASTDest.MD_REGULAR]: {
        [ProcFlavor.HOVER_PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);
          await checkString(
            resp.contents.toLowerCase(),
            `![foo alt txt](${path.join(
              opts.wsRoot,
              opts.vaults[0].fsPath,
              "/assets/foo.jpg"
            )})`.toLowerCase()
          );
        },
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
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
            `Here is the footnote.<a class="fn" href="#fnref-1">˄</a>`
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

  const WIKILINK_WITH_ANCHOR = createProcCompileTests({
    name: "WIKILINK_WITH_ANCHOR",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = `[[alias|egg#header]]`;
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.MD_REGULAR]: {
        /**
         * Test that a wiklink in hover preview will be translated into a vscode
         * command URI to use GoToNote for navigation
         * @param opts
         */
        [ProcFlavor.HOVER_PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);

          const goToNoteCommandOpts = {
            qs: "egg",
            vault: {
              fsPath: "vault1",
            },
            anchor: AnchorUtils.string2anchor("header"),
          };

          await checkString(
            resp.contents,
            `[alias](command:dendron.gotoNote?${encodeURIComponent(
              JSON.stringify(goToNoteCommandOpts)
            )})`
          );
        },
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
    },
  });

  const USER_TAGS = createProcCompileTests({
    name: "USER_TAGS",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = `@johndoe`;
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.MD_REGULAR]: {
        /**
         * Test that a wiklink in hover preview will be translated into a vscode
         * command URI to use GoToNote for navigation
         * @param opts
         */
        [ProcFlavor.HOVER_PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);

          const goToNoteCommandOpts = {
            qs: "user.johndoe",
            vault: {
              fsPath: "vault1",
            },
          };

          await checkString(
            resp.contents,
            `[@johndoe](command:dendron.gotoNote?${encodeURIComponent(
              JSON.stringify(goToNoteCommandOpts)
            )})`
          );
        },
      },
    },
    preSetupHook: async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
    },
  });

  const HASH_TAGS = createProcCompileTests({
    name: "HASH_TAGS",
    setup: async (opts) => {
      const { proc } = getOpts(opts);
      const txt = `#sample`;
      const resp = await proc.process(txt);
      return { resp, proc };
    },
    verify: {
      [DendronASTDest.MD_REGULAR]: {
        /**
         * Test that a wiklink in hover preview will be translated into a vscode
         * command URI to use GoToNote for navigation
         * @param opts
         */
        [ProcFlavor.HOVER_PREVIEW]: async (opts) => {
          const {
            extra: { resp },
          } = cleanVerifyOpts(opts);

          const goToNoteCommandOpts = {
            qs: "tags.sample",
            vault: {
              fsPath: "vault1",
            },
          };

          await checkString(
            resp.contents,
            `[#sample](command:dendron.gotoNote?${encodeURIComponent(
              JSON.stringify(goToNoteCommandOpts)
            )})`
          );
        },
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
    ...WILDCARD_NOTE_REF_MISSING,
    ...WIKILINK_WITH_ANCHOR,
    ...USER_TAGS,
    ...HASH_TAGS,
  ];

  test.each(
    ALL_TEST_CASES.map((ent) => [
      `${ent.dest}: ${ent.name}: ${ent.flavor}`,
      ent.testCase,
    ])
    // @ts-ignore
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
      createEngine: createEngineFromServer,
    });
  });
});
