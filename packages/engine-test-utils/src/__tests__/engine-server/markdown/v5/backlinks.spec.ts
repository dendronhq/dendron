import { NoteUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DendronASTDest, ProcFlavor } from "@dendronhq/engine-server";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkNotInVFile, checkVFile, createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

// NOTE: for setup code details, see, [[../packages/common-test-utils/src/presets/notes.ts#^5xetq2e7t2z4]]

describe("WHEN enableBackLinks", () => {
  runTestCases(
    createProcCompileTests({
      name: "enableBackLinks",
      fname: "alpha",
      setup: async (opts) => {
        const { proc } = getOpts(opts);
        const resp = await proc.process("");
        return { resp, proc };
      },
      verify: {
        [DendronASTDest.HTML]: {
          [ProcFlavor.PUBLISHING]: async ({ extra }) => {
            const { resp } = extra;
            await checkVFile(resp, "Backlinks", "beta");
          },
        },
      },
      preSetupHook: ENGINE_HOOKS.setupLinks,
    })
  );
});

describe("WHEN note enableBackLinks = false", () => {
  runTestCases(
    createProcCompileTests({
      name: "noEnableBackLinks",
      fname: "alpha",
      setup: async (opts) => {
        const { proc } = getOpts(opts);
        const resp = await proc.process("");
        return { resp, proc };
      },
      verify: {
        [DendronASTDest.HTML]: {
          [ProcFlavor.PUBLISHING]: async ({ extra }) => {
            const { resp } = extra;
            await checkNotInVFile(resp, "Backlinks", "beta");
          },
        },
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupLinks(opts);
        await NoteTestUtilsV4.modifyNoteByPath(
          { ...opts, vault: opts.vaults[0], fname: "alpha" },
          (note) => {
            NoteUtils.updateNoteLocalConfig(note, "global", {
              enableBackLinks: false,
            });
            return note;
          }
        );
      },
    })
  );
});
