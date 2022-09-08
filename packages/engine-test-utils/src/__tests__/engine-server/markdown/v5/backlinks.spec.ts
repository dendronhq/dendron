import {
  ConfigUtils,
  DVaultVisibility,
  NoteUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { note2File } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DendronASTDest, MDUtilsV5, ProcFlavor } from "@dendronhq/unified";
import { TestConfigUtils } from "../../../../config";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../../presets";
import { checkNotInVFile, checkVFile, createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

// NOTE: for setup code details, see, [[../packages/common-test-utils/src/presets/notes.ts#^5xetq2e7t2z4]]
describe("GIVEN dendron.yml default", () => {
  describe("WHEN regular run", () => {
    describe("AND note has backlinks", () => {
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

  describe("WHEN generating backlinks for publishing", () => {
    describe("AND note has backlink to home page", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN backlinks are generated",
          fname: "beta",
          setup: async (opts) => {
            const { proc } = getOpts(opts);
            const resp = await proc.process("");
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.HTML]: {
              [ProcFlavor.PUBLISHING]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(
                  resp,
                  "Backlinks",
                  `<a href="/">Alpha (vault1)</a>`
                );
              },
            },
          },
          preSetupHook: async (opts) => {
            const { wsRoot } = opts;
            await ENGINE_HOOKS.setupLinks(opts);
            TestConfigUtils.withConfig(
              (config) => {
                ConfigUtils.setPublishProp(config, "siteHierarchies", [
                  "alpha",
                ]);
                ConfigUtils.setPublishProp(
                  config,
                  "siteUrl",
                  "https://foo.com"
                );
                ConfigUtils.setPublishProp(config, "siteIndex", "alpha");
                return config;
              },
              {
                wsRoot,
              }
            );
          },
        })
      );
    });
  });

  describe("WHEN generating backlinks to private vaults", () => {
    runTestCases(
      createProcCompileTests({
        name: "THEN private backlinks not added",
        fname: "one",
        setup: async (opts) => {
          const vaults = opts.vaults;
          const { proc } = getOpts(opts);
          const bvault = vaults.find((ent: any) => ent.fsPath === "vault2");
          bvault!.visibility = DVaultVisibility.PRIVATE;

          MDUtilsV5.setProcData(proc, { vaults });
          const resp = await proc.process("");
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.PUBLISHING]: async ({ extra }) => {
              const { resp } = extra;
              await checkVFile(
                resp,
                `<a href="/notes/not-secret.html">Not Secret (vaultThree)</a>`
              );
              await checkNotInVFile(
                resp,
                `<a href="/notes/secret1">Secret1 (vault2)</a>`,
                `<a href="/notes/secret2">Secret2 (vault2)</a>`
              );
            },
          },
        },
        preSetupHook: async (opts: any) => {
          await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);

          TestConfigUtils.withConfig(
            (config) => {
              const vaults = ConfigUtils.getVaults(config);
              const bvault = vaults.find((ent: any) => ent.fsPath === "vault2");
              bvault!.visibility = DVaultVisibility.PRIVATE;
              const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
              ConfigUtils.setVaults(v4DefaultConfig, vaults);
              return v4DefaultConfig;
            },
            { wsRoot: opts.wsRoot }
          );

          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            fname: "one",
            vault: vaults[0],
            wsRoot,
            body: "one",
          });
          await NoteTestUtilsV4.createNote({
            fname: "secret1",
            vault: vaults[1],
            wsRoot,
            body: "[[one]]",
          });
          await NoteTestUtilsV4.createNote({
            fname: "secret2",
            vault: vaults[1],
            wsRoot,
            body: "[[one]]",
          });
          await NoteTestUtilsV4.createNote({
            fname: "not-secret",
            vault: vaults[2],
            wsRoot,
            body: "[[one]]",
          });
        },
      })
    );
  });

  describe("WHEN generating backlink to invalid note", () => {
    runTestCases(
      createProcCompileTests({
        name: "THEN do not crash",
        fname: "one",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const resp = await proc.process("");
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.PUBLISHING]: async ({ extra }) => {
              const { resp } = extra;
              await checkVFile(resp, "Backlinks");
            },
          },
        },
        preSetupHook: async (opts: any) => {
          await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);

          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            fname: "one",
            vault: vaults[0],
            wsRoot,
            body: "one",
          });
          await NoteTestUtilsV4.createNote({
            fname: "duplicateOne",
            vault: vaults[1],
            wsRoot,
            body: "[[one]]",
          });

          // Create a note with the same ID as the previous note to create an
          // invalid engine state, and add links to the target note from both
          // notes with the same ID:
          const note = NoteUtils.create({
            created: 1,
            updated: 1,
            id: "duplicateOne",
            fname: "duplicateTwo",
            vault: vaults[1],
            body: "[[one]]",
          });
          await note2File({ note, vault: vaults[1], wsRoot });
        },
      })
    );
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
