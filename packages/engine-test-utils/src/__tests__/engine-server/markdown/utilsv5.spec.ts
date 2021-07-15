import {
  NoteTestUtilsV4,
  TestPresetEntryV4
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  Processor,
  ProcFlavor
} from "@dendronhq/engine-server";
import path from "path";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkString } from "../../../utils";
import { cleanVerifyOpts, createProcCompileTests } from "./utils";

const getOpts = (opts: any) => {
  const _copts = opts.extra as { proc: Processor; dest: DendronASTDest };
  return _copts;
};

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
        await checkString(resp.contents, `assets%2Ffoo.jpg`, "localhost");
      },
      [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
    },
    [DendronASTDest.MD_REGULAR]: {
      [ProcFlavor.HOVER_PREVIEW]: async (opts) => {
        const {
          extra: { resp },
        } = cleanVerifyOpts(opts);
        await checkString(resp.contents,
          `![foo alt txt](${path.join(opts.wsRoot, opts.vaults[0].fsPath, '/assets/foo.jpg')})`,
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
          // title should be fname,
          "Alpha</h1>",
          // html quoted
          `<p><a href="bar.html">Bar</a></p>`
        );
      },
      [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
      [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
    },
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
    await NoteTestUtilsV4.createNote({fname: "alpha", body: "[[bar]]", vault: opts.vaults[0], wsRoot: opts.wsRoot, props: {id: "alpha-id"}});
  },
});
const ALL_TEST_CASES = [
  ...IMAGE_WITH_LEAD_FORWARD_SLASH,
  ...NOTE_REF_BASIC_WITH_REHYPE,
];

describe("MDUtils.proc", () => {
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
