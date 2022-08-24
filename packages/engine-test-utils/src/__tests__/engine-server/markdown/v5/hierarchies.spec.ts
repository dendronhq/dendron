import { NoteUtils, WorkspaceOpts } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DendronASTDest, ProcFlavor } from "@dendronhq/unified";
import { TestConfigUtils } from "../../../../config";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkNotInVFile, checkVFile, createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

describe("WHEN enableChildLinks", () => {
  runTestCases(
    createProcCompileTests({
      name: "enableChildLinks",
      setup: async (opts) => {
        const { proc } = getOpts(opts);
        const txt = `foo test`;
        const resp = await proc.process(txt);
        return { resp, proc };
      },
      verify: {
        [DendronASTDest.HTML]: {
          [ProcFlavor.PUBLISHING]: async ({ extra }) => {
            const { resp } = extra;
            await checkVFile(resp, "Children", "foo.ch1");
          },
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    })
  );
});

describe("WHEN note enableChildLinks = false", () => {
  runTestCases(
    createProcCompileTests({
      name: "noEnableChildLinks",
      setup: async (opts) => {
        const { proc } = getOpts(opts);
        const txt = `foo test`;
        const resp = await proc.process(txt);
        return { resp, proc };
      },
      verify: {
        [DendronASTDest.HTML]: {
          [ProcFlavor.PUBLISHING]: async ({ extra }) => {
            const { resp } = extra;
            await checkNotInVFile(resp, "Children", "foo.ch1");
          },
        },
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await NoteTestUtilsV4.modifyNoteByPath(
          { ...opts, vault: opts.vaults[0], fname: "foo" },
          (note) => {
            NoteUtils.updateNoteLocalConfig(note, "global", {
              enableChildLinks: false,
            });
            return note;
          }
        );
      },
    })
  );
});

describe("WHEN enableHierarchyDisplay is set to true", () => {
  const BASIC_TEXT = "[Ch1](foo.ch1.html)";
  runTestCases(
    createProcCompileTests({
      name: "enableHierarchyDisplay",
      setup: async (opts) => {
        const { proc } = getOpts(opts);

        const resp = await proc.process(BASIC_TEXT);
        return { resp, proc };
      },
      verify: {
        [DendronASTDest.HTML]: {
          [ProcFlavor.PUBLISHING]: async ({ extra }) => {
            const { resp } = extra;
            await checkVFile(resp, "Children");
          },
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    })
  );
});

describe("WHEN enableHierarchyDisplay is set to false", () => {
  const preSetupHook = async (opts: WorkspaceOpts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    TestConfigUtils.withConfig((config) => {
      config.publishing!.enableHierarchyDisplay = false;
      return config;
    }, opts);
  };
  const BASIC_TEXT = "[Ch1](foo.ch1.html)";
  runTestCases(
    createProcCompileTests({
      name: "enableHierarchyDisplay",
      setup: async (opts) => {
        const { proc } = getOpts(opts);

        const resp = await proc.process(BASIC_TEXT);
        return { resp, proc };
      },
      verify: {
        [DendronASTDest.HTML]: {
          [ProcFlavor.PUBLISHING]: async ({ extra }) => {
            const { resp } = extra;
            await checkNotInVFile(resp, "Children");
          },
        },
      },
      preSetupHook,
    })
  );
});

describe("WHEN hierarchyDisplayTitle is set to 'Better Children' ", () => {
  const preSetupHook = async (opts: WorkspaceOpts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    TestConfigUtils.withConfig((config) => {
      config.publishing!.hierarchyDisplayTitle = "Better Children";
      return config;
    }, opts);
  };
  const BASIC_TEXT = "[Ch1](foo.ch1.html)";
  runTestCases(
    createProcCompileTests({
      name: "hierarchyDisplayTitle",
      setup: async (opts) => {
        const { proc } = getOpts(opts);

        const resp = await proc.process(BASIC_TEXT);
        return { resp, proc };
      },
      verify: {
        [DendronASTDest.HTML]: {
          [ProcFlavor.PUBLISHING]: async ({ extra }) => {
            const { resp } = extra;
            await checkVFile(resp, "Better Children");
          },
        },
      },
      preSetupHook,
    })
  );
});
