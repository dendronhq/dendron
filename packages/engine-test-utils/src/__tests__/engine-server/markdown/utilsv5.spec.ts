import { NoteProps, WorkspaceOpts } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  Processor,
  ProcFlavor,
} from "@dendronhq/engine-server";
import { vault2Path } from "../../../../../common-server/lib";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkString } from "../../../utils";
import { cleanVerifyOpts, createProcCompileTests } from "./utils";

let getOpts = (opts: any) => {
  const _copts = opts.extra as { proc: Processor; dest: DendronASTDest };
  return _copts;
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
          vaults,
          wsRoot,
        } = cleanVerifyOpts(opts);
        const vpath = vault2Path({ vault: vaults[0], wsRoot });
        expect(resp).toMatchSnapshot();
        await checkString(
          resp.contents,
          `<img src="${vpath}/assets/foo.jpg" alt="foo alt txt">`
        );
      },
      [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
    },
  },
});
const NOTE_REF_BASIC_WITH_REHYPE = createProcCompileTests({
  name: "NOTE_REF_WITH_REHYPE",
  setup: async (opts) => {
    const { proc } = getOpts(opts);
    const txt = `![[foo.md]]`;
    const resp = await proc.process(txt);
    return { resp, proc };
  },
  verify: {
    [DendronASTDest.HTML]: {
      [ProcFlavor.REGULAR]: async ({ extra }) => {
        const { resp } = extra;
        await checkString(
          resp.contents,
          // should have id
          `<a href=\"foo-id.html\"`,
          // html quoted
          `<p><a href=\"bar.html\">Bar</a></p>`
        );
      },
      [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
      [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
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
    });
  });
});
