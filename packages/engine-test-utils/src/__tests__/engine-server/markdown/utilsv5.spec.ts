import { NoteProps, WorkspaceOpts } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronASTDest, Processor } from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkString } from "../../../utils";
import { createProcCompileTests } from "./utils";

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

const NOTE_REF_BASIC_WITH_REHYPE = createProcCompileTests({
  name: "NOTE_REF_WITH_REHYPE",
  setupFunc: async (opts) => {
    const { proc } = getOpts(opts);
    const txt = `![[foo.md]]`;
    const resp = await proc.process(txt);
    return { resp, proc };
  },
  verifyFuncDict: {
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot("respRehype");
      await checkString(
        resp.contents,
        // should have id
        `<a href=\"foo-id.html\"`,
        // html quoted
        `<p><a href=\"bar.html\">Bar</a></p>`
      );
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

const ALL_TEST_CASES = [...NOTE_REF_BASIC_WITH_REHYPE];

describe("MDUtils.proc", () => {
  test.each(
    ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV5(testCase.testFunc, {
      expect,
      preSetupHook: testCase.preSetupHook,
    });
  });
});
