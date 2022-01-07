import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import {
  FileTestUtils,
  NOTE_PRESETS_V4,
  RunEngineTestFunctionOpts,
} from "@dendronhq/common-test-utils";
import {
  MarkdownExportPodV2,
  PodExportScope,
  RunnableMarkdownV2PodConfig,
} from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";

/**
 * MarkdownExportPod
 */
describe("GIVEN a Markdown Export Pod with a particular config", () => {
  describe("When the destination is clipboard", () => {
    const setupPod = (opts: RunEngineTestFunctionOpts, fname: string) => {
      const podConfig: RunnableMarkdownV2PodConfig = {
        exportScope: PodExportScope.Note,
        destination: "clipboard",
      };

      const pod = new MarkdownExportPodV2({
        podConfig,
        engine: opts.engine,
        dendronConfig: opts.dendronConfig!,
      });
      const props = NoteUtils.getNoteByFnameFromEngine({
        fname,
        vault: opts.vaults[0],
        engine: opts.engine,
      }) as NoteProps;
      return { pod, props };
    };
    describe("WHEN exporting a note", () => {
      test("THEN expect wikilinks to be converted", async () => {
        await runEngineTestV5(
          async (opts) => {
            const { pod, props } = setupPod(opts, "simple-wikilink");
            const result = await pod.exportNote(props);
            const data = result.data?.exportedNotes!;
            expect(_.isString(data)).toBeTruthy();
            if (_.isString(data)) {
              expect(
                data?.includes("[One](/simple-wikilink/one)")
              ).toBeTruthy();
            }
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_SIMPLE.create({
                wsRoot,
                vault: vaults[0],
              });
              await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_SIMPLE_TARGET.create({
                wsRoot,
                vault: vaults[0],
              });
            },
          }
        );
      });
    });
    describe("WHEN convertUserNotesToLinks is not configured explicitly", () => {
      test("THEN expect user tags to remain unchanged", async () => {
        await runEngineTestV5(
          async (opts) => {
            const { pod, props } = setupPod(opts, "usertag");
            const result = await pod.exportNote(props);
            const data = result.data?.exportedNotes!;
            expect(_.isString(data)).toBeTruthy();
            if (_.isString(data)) {
              expect(data.includes("@johndoe")).toBeTruthy();
              expect(data.includes("[@johndoe](/user/johndoe)")).toBeFalsy();
            }
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              await NOTE_PRESETS_V4.NOTE_WITH_USERTAG.create({
                wsRoot,
                vault: vaults[0],
              });
            },
          }
        );
      });
    });

    describe("WHEN addFrontmatterTitle is set to false", () => {
      test("THEN expect title to not be present as h1 header", async () => {
        await runEngineTestV5(
          async (opts) => {
            const podConfig: RunnableMarkdownV2PodConfig = {
              exportScope: PodExportScope.Note,
              destination: "clipboard",
              addFrontmatterTitle: false,
            };

            const pod = new MarkdownExportPodV2({
              podConfig,
              engine: opts.engine,
              dendronConfig: opts.dendronConfig!,
            });

            const props = NoteUtils.getNoteByFnameFromEngine({
              fname: "usertag",
              vault: opts.vaults[0],
              engine: opts.engine,
            }) as NoteProps;

            const result = await pod.exportNote(props);
            const data = result.data?.exportedNotes!;
            expect(_.isString(data)).toBeTruthy();
            if (_.isString(data)) {
              expect(data.indexOf("Usertag")).toEqual(-1);
            }
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              await NOTE_PRESETS_V4.NOTE_WITH_USERTAG.create({
                wsRoot,
                vault: vaults[0],
              });
            },
          }
        );
      });
    });

    describe("WHEN convertTagNotesToLinks is set to false", () => {
      test("THEN expect tags to remain unparsed", async () => {
        await runEngineTestV5(
          async (opts) => {
            const { pod, props } = setupPod(opts, "footag");
            const result = await pod.exportNote(props);
            const data = result.data?.exportedNotes!;
            expect(_.isString(data)).toBeTruthy();
            if (_.isString(data)) {
              expect(data.includes("#foobar")).toBeTruthy();
              expect(data.includes("[#foobar](/tags/foobar")).toBeFalsy();
            }
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              await NOTE_PRESETS_V4.NOTE_WITH_TAG.create({
                wsRoot,
                vault: vaults[0],
              });
            },
          }
        );
      });
    });
  });

  describe("When the destination is file system", () => {
    let exportDest: string;
    beforeAll(() => {
      exportDest = tmpDir().name;
      console.log("exportDest", exportDest);
    });

    afterEach(() => {
      // clean up the export directory after each test.
      fs.rmdirSync(exportDest, { recursive: true });
    });
    describe("WHEN exporting a note", () => {
      test("THEN expect note to be exported", async () => {
        await runEngineTestV5(
          async (opts) => {
            const podConfig: RunnableMarkdownV2PodConfig = {
              exportScope: PodExportScope.Note,
              destination: exportDest,
            };
            console.log("exportDest", exportDest);
            const pod = new MarkdownExportPodV2({
              podConfig,
              engine: opts.engine,
              dendronConfig: opts.dendronConfig!,
            });

            const props = NoteUtils.getNoteByFnameFromEngine({
              fname: "bar",
              vault: opts.vaults[0],
              engine: opts.engine,
            }) as NoteProps;
            console.log("props", props);
            console.log("vault", opts.vaults[0]);

            await pod.exportNote(props);
            const [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
              path.join(exportDest, "vault1"),
              ["bar.md"]
            );
            expect(actualFiles).toEqual(expectedFiles);

            // check contents
            const foo = fs.readFileSync(
              path.join(exportDest, "vault1", "bar.md"),
              {
                encoding: "utf8",
              }
            );
            expect(foo).toContain("bar body");
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupBasic,
          }
        );
      });
    });
    describe("WHEN exporting a vault", () => {
      test("THEN expect vault to be exported", async () => {
        await runEngineTestV5(
          async (opts) => {
            const podConfig: RunnableMarkdownV2PodConfig = {
              exportScope: PodExportScope.Vault,
              destination: exportDest,
            };

            const pod = new MarkdownExportPodV2({
              podConfig,
              engine: opts.engine,
              dendronConfig: opts.dendronConfig!,
            });
            const notes = Object.values(opts.engine.notes).filter(
              (note) =>
                note.stub !== true &&
                VaultUtils.isEqualV2(note.vault, opts.vaults[0])
            );
            await pod.exportNotes(notes);
            const [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
              path.join(exportDest, "vault1"),
              ["bar.md", "foo.md", "root.md", "foo"] // foo is a directory
            );
            expect(actualFiles).toEqual(expectedFiles);
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupBasic,
          }
        );
      });
    });
    describe("WHEN exporting a workspace", () => {
      test("THEN expect all workspace notes to be exported", async () => {
        await runEngineTestV5(
          async (opts) => {
            const podConfig: RunnableMarkdownV2PodConfig = {
              exportScope: PodExportScope.Workspace,
              destination: exportDest,
            };
            const pod = new MarkdownExportPodV2({
              podConfig,
              engine: opts.engine,
              dendronConfig: opts.dendronConfig!,
            });
            const notes = Object.values(opts.engine.notes).filter(
              (note) => note.stub !== true
            );
            await pod.exportNotes(notes);
            let [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
              exportDest,
              ["vault1", "vault2", "vaultThree"]
            );
            expect(actualFiles).toEqual(expectedFiles);
            [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
              path.join(exportDest, "vault1"),
              ["bar.md", "foo.md", "root.md", "foo"] // foo is a directory
            );
            expect(actualFiles).toEqual(expectedFiles);

            [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
              path.join(exportDest, "vault1", "foo"),
              ["ch1.md"]
            );
            expect(actualFiles).toEqual(expectedFiles);
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupBasic,
          }
        );
      });
      test("THEN export assets", async () => {
        await runEngineTestV5(
          async (opts) => {
            const podConfig: RunnableMarkdownV2PodConfig = {
              exportScope: PodExportScope.Workspace,
              destination: exportDest,
            };
            const pod = new MarkdownExportPodV2({
              podConfig,
              engine: opts.engine,
              dendronConfig: opts.dendronConfig!,
            });
            const notes = Object.values(opts.engine.notes).filter(
              (note) => note.stub !== true
            );
            await pod.exportNotes(notes);
            let [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
              path.join(exportDest, "vault1"),
              ["root.md", "assets"]
            );
            expect(actualFiles).toEqual(expectedFiles);

            [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
              path.join(exportDest, "vault1", "assets/text"),
              ["test.txt"]
            );
            expect(actualFiles).toEqual(expectedFiles);
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              const rootDir = path.join(
                wsRoot,
                VaultUtils.getRelPath(vaults[0]),
                "assets/text"
              );
              await fs.ensureDir(rootDir);
              await fs.writeFile(path.join(rootDir, "test.txt"), "hello world");
            },
          }
        );
      });
    });
  });
});
