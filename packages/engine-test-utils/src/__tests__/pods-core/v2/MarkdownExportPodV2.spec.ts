import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import {
  FileTestUtils,
  NoteTestUtilsV4,
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
    const setupPod = (setupOpts: {
      opts: RunEngineTestFunctionOpts;
      fname: string;
      podConfigOpts?: Partial<RunnableMarkdownV2PodConfig>;
    }) => {
      const { opts, fname, podConfigOpts } = setupOpts;
      const config = opts.engine.config;
      if (config.publishing) {
        config.publishing.siteUrl = "https://foo.com";
      }
      const podConfig: RunnableMarkdownV2PodConfig = {
        exportScope: PodExportScope.Note,
        destination: "clipboard",
        ...podConfigOpts,
      };

      const pod = new MarkdownExportPodV2({
        podConfig,
        engine: opts.engine,
        dendronConfig: config,
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
            const { pod, props } = setupPod({ opts, fname: "simple-wikilink" });
            const result = await pod.exportNotes([props]);
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
            const { pod, props } = setupPod({ opts, fname: "usertag" });
            const result = await pod.exportNotes([props]);
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
            const { pod, props } = setupPod({
              opts,
              fname: "usertag",
              podConfigOpts: { addFrontmatterTitle: false },
            });
            const result = await pod.exportNotes([props]);
            const data = result.data?.exportedNotes!;
            expect(_.isString(data)).toBeTruthy();
            if (_.isString(data)) {
              expect(data).not.toContain("Usertag");
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
            const { pod, props } = setupPod({ opts, fname: "footag" });
            const result = await pod.exportNotes([props]);
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

    describe("AND WHEN wikilinkToURL is set to true", () => {
      test("THEN expect wikilinks to update with note URL and ref links to be resolved", async () => {
        await runEngineTestV5(
          async (opts) => {
            const { props, pod } = setupPod({
              opts,
              fname: "parent",
              podConfigOpts: { wikiLinkToURL: true },
            });
            const result = await pod.exportNotes([props]);
            const data = result.data?.exportedNotes!;
            expect(_.isString(data)).toBeTruthy();
            if (_.isString(data)) {
              expect(data).toContain("[Foo](https://foo.com/notes/foo.html)");
              expect(data).toContain("foo body");
              expect(data).not.toContain("[foo](/notes/foo)");
              expect(data).not.toContain("![[foo]]");
            }
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
                wsRoot,
                vault: vaults[0],
              });
              await NoteTestUtilsV4.createNote({
                wsRoot,
                vault: vaults[0],
                fname: "parent",
                body: ["![[foo]]", "[[foo]]"].join("\n"),
              });
            },
          }
        );
      });
      test("THEN expect wikilinks inside ref links to be converted to Note URL", async () => {
        await runEngineTestV5(
          async (opts) => {
            const { props, pod } = setupPod({
              opts,
              fname: "beta",
              podConfigOpts: { wikiLinkToURL: true },
            });
            const result = await pod.exportNotes([props]);
            const data = result.data?.exportedNotes!;
            expect(_.isString(data)).toBeTruthy();
            if (_.isString(data)) {
              expect(data).toContain("[Foo](https://foo.com/notes/foo.html)");
              expect(data).not.toContain("![[alpha]]");
              expect(data).not.toContain("[foo](/notes/foo)");
            }
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              //fname foo, body: foo body
              await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
                wsRoot,
                vault: vaults[0],
              });
              // fname: "beta", body: "![[alpha]]",
              await NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_LINK.create({
                wsRoot,
                vault: vaults[0],
              });
              await NoteTestUtilsV4.createNote({
                wsRoot,
                vault: vaults[0],
                fname: "alpha",
                body: "[[foo]]",
              });
            },
          }
        );
      });
      test("THEN expect cross vault wikilinks inside ref links to be converted to Note URL", async () => {
        await runEngineTestV5(
          async (opts) => {
            const { props, pod } = setupPod({
              opts,
              fname: "beta",
              podConfigOpts: { wikiLinkToURL: true },
            });
            const result = await pod.exportNotes([props]);
            const data = result.data?.exportedNotes!;
            expect(_.isString(data)).toBeTruthy();
            if (_.isString(data)) {
              expect(data).toContain("[Foo](https://foo.com/notes/foo.html)");
              expect(data).not.toContain("[foo](/notes/foo)");
              expect(data).not.toContain("![[alpha]]");
            }
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              //fname foo, body: foo body in vault2
              await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
                wsRoot,
                vault: vaults[1],
              });
              //fname foo, body: foo body in vault1
              await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
                wsRoot,
                vault: vaults[0],
                genRandomId: true,
              });
              // fname: "beta", body: "![[alpha]]",
              await NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_LINK.create({
                wsRoot,
                vault: vaults[0],
              });
              await NoteTestUtilsV4.createNote({
                wsRoot,
                vault: vaults[0],
                fname: "alpha",
                body: "[[dendron://vault2/foo]]",
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

            await pod.exportNotes([props]);
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
