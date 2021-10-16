import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  Processor,
  ProcFlavor,
} from "@dendronhq/engine-server";
import { TestConfigUtils } from "../../../..";
import { createEngineFromServer, runEngineTestV5 } from "../../../../engine";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkNotInString, checkString } from "../../../../utils";
import { checkVFile, createProcCompileTests, ProcTests } from "../utils";

const getOpts = (opts: any) => {
  const _copts = opts.extra as { proc: Processor; dest: DendronASTDest };
  return _copts;
};

const runTestCases = (testCases: ProcTests[]) => {
  test.each(
    testCases.map((ent) => [
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
};

describe("GIVEN noteRef plugin", () => {
  describe("WHEN note ref missing", () => {
    runTestCases(
      createProcCompileTests({
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
      })
    );
  });

  describe("WHEN note ref to html AND prettyLinks = true", () => {
    runTestCases(
      createProcCompileTests({
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
              await checkVFile(
                resp,
                // should have id for link
                `<a href="alpha-id"`,
                // html quoted
                `<p><a href="bar">Bar</a></p>`
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
                `<a href="/notes/alpha-id"`,
                `<a href="/notes/bar">Bar</a>`
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
          TestConfigUtils.withConfig(
            (config) => {
              config.site.usePrettyLinks = true;
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      })
    );
  });
});
