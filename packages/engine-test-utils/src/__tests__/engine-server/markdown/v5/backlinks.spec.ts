import { NoteUtils, WorkspaceOpts } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DendronASTDest, ProcFlavor } from "@dendronhq/engine-server";
import { TestConfigUtils } from "../../../../config";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkNotInVFile, checkVFile, createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

// NOTE: for setup code details, see, [[../packages/common-test-utils/src/presets/notes.ts#^5xetq2e7t2z4]]
describe("GIVEN dendron.yml default", () => {
  describe("WHEN regular run", () => {
    runTestCases(
      createProcCompileTests({
        name: "THEN backlinks are generated",
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

  describe("WHEN enableBackLinks = false", () => {
    const setup = async (opts: WorkspaceOpts) => {
      await ENGINE_HOOKS.setupLinks(opts);
      TestConfigUtils.withConfig((config) => {
        config.publishing!.enableBackLinks = false;
        return config;
      }, opts);
    };

    describe("AND WHEN no note override", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN backlinks are not generated",
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
            return setup(opts);
          },
        })
      );
    });

    describe("GIVEN note override,", () => {
      describe("WHEN note enableBackLinks = true", () => {
        runTestCases(
          createProcCompileTests({
            name: "THEN backlinks are generated",
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
            preSetupHook: async (opts) => {
              await setup(opts);
              await NoteTestUtilsV4.modifyNoteByPath(
                { ...opts, vault: opts.vaults[0], fname: "alpha" },
                (note) => {
                  NoteUtils.updateNoteLocalConfig(note, "global", {
                    enableBackLinks: true,
                  });
                  return note;
                }
              );
            },
          })
        );
      });

      describe("WHEN note enableBackLinks = false", () => {
        runTestCases(
          createProcCompileTests({
            name: "THEN backlinks are not generated",
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
              await setup(opts);
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
    });
  });
});

describe("GIVEN note override,", () => {
  describe("WHEN note enableBackLinks = true", () => {
    runTestCases(
      createProcCompileTests({
        name: "THEN backlinks are generated",
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
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupLinks(opts);
          await NoteTestUtilsV4.modifyNoteByPath(
            { ...opts, vault: opts.vaults[0], fname: "alpha" },
            (note) => {
              NoteUtils.updateNoteLocalConfig(note, "global", {
                enableBackLinks: true,
              });
              return note;
            }
          );
        },
      })
    );
  });

  describe("WHEN note enableBackLinks = false", () => {
    runTestCases(
      createProcCompileTests({
        name: "THEN backlinks are not generated",
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
});
