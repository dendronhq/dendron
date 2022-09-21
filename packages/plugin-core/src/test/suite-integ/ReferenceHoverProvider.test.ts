import { NoteProps, VaultUtils } from "@dendronhq/common-all";
import {
  AssertUtils,
  FileTestUtils,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { before, describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { MarkdownString } from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import ReferenceHoverProvider from "../../features/ReferenceHoverProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect, LocationTestUtils } from "../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

async function provide({
  editor,
  pos,
}: {
  editor: vscode.TextEditor;
  pos: vscode.Position;
}) {
  const doc = editor?.document as vscode.TextDocument;
  const referenceProvider = new ReferenceHoverProvider();
  return referenceProvider.provideHover(doc, pos);
}

async function provideForNote(editor: vscode.TextEditor) {
  return provide({ editor, pos: new vscode.Position(7, 4) });
}

async function provideForNonNote(editor: vscode.TextEditor) {
  return provide({ editor, pos: new vscode.Position(0, 2) });
}

suite("GIVEN ReferenceHoverProvider", function () {
  const ctx = setupBeforeAfter(this);

  describeMultiWS(
    "AND WHEN used in non-dendron file",
    {
      ctx,
      preSetupHook: async (opts) => {
        return FileTestUtils.createFiles(opts.wsRoot, [
          { path: "sample.with-header", body: "## Foo" },
          { path: "sample.empty", body: "" },
        ]);
      },
    },
    () => {
      describe("AND the file is empty", () => {
        test("THEN return null", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const notePath = path.join(wsRoot, "sample.empty");
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          const hover = await provideForNonNote(editor!);
          expect(hover).toEqual(null);
        });
      });

      describe("AND file has a header", () => {
        test("THEN return null", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const notePath = path.join(wsRoot, "sample.with-header");
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          const hover = await provideForNonNote(editor!);
          expect(hover).toEqual(null);
        });
      });
    }
  );

  describe("has correct hover contents", () => {
    describe("wikilink", () => {
      test("basic", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "[[target]]",
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(7, 4)
            );
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
            });
            done();
          },
        });
      });

      test("missing notes are marked as such", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "[[target]]", // target doesn't exist
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: hover!.contents.join(""),
              match: [
                `Note target is missing`,
                `use "Dendron: Go to Note" command`,
              ],
            });
            done();
          },
        });
      });

      test.skip("contains local image", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Sint quo sunt maxime.",
                "![](/assets/test/image.png)",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "[[target]]",
            });
          },
          onInit: async ({ wsRoot, vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            // Local images should get full path to image, because hover preview otherwise can't find the image
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                `![](${path.join(
                  wsRoot,
                  VaultUtils.getRelPath(vaults[0]),
                  "assets/test/image.png"
                )})`,
              ],
            });
            done();
          },
        });
      });

      test("contains remote image", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Sint quo sunt maxime.",
                "![](https://example.com/image.png)",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "[[target]]",
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(7, 4)
            );
            expect(hover).toBeTruthy();
            // remote images should be unmodified
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "![](https://example.com/image.png)",
              ],
            });
            done();
          },
        });
      });

      test("with alias", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "[[my note alias|target]]",
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
            });
            done();
          },
        });
      });

      test("with xvault", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            // Creating a note of the same name in multiple vaults to check that it gets the right one
            await NoteTestUtilsV4.createNote({
              vault: vaults[1],
              wsRoot,
              fname: "target",
              body: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: "Voluptatem possimus harum nisi.",
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: `[[dendron://${VaultUtils.getName(vaults[1])}/target]]`,
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
              nomatch: ["Voluptatem possimus harum nisi."],
            });
            done();
          },
        });
      });

      test("with header", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Voluptatem possimus harum nisi.",
                "",
                "# Numquam occaecati",
                "",
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: `[[target#numquam-occaecati]]`,
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(7, 12)
            );
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
              nomatch: ["Voluptatem possimus harum nisi."],
            });
            done();
          },
        });
      });

      test("with block anchor", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Voluptatem possimus harum nisi.",
                "",
                "# Numquam occaecati",
                "",
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima. ^my-anchor",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: `[[target#^my-anchor]]`,
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
              nomatch: ["Voluptatem possimus harum nisi.", "Numquam occaecati"],
            });
            done();
          },
        });
      });

      test("with everything", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[1],
              wsRoot,
              fname: "target",
              body: [
                "Voluptatem possimus harum nisi.",
                "",
                "# Numquam occaecati",
                "",
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: "Voluptatem possimus harum nisi.",
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: `[[My note: with an alias|dendron://${VaultUtils.getName(
                vaults[1]
              )}/target#numquam-occaecati]]`,
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
              nomatch: ["Voluptatem possimus harum nisi."],
            });
            done();
          },
        });
      });

      describe("multiple notes & xvault link", () => {
        test("non-xvault link resolves to same vault", (done) => {
          let note: NoteProps;
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async (opts) => {
              note = await ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
            },
            onInit: async () => {
              const editor = await WSUtils.openNote(note);
              editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
                line: 7,
              });
              const hover = await provideForNote(editor);
              expect(hover).toBeTruthy();
              expect(
                await AssertUtils.assertInString({
                  body: (hover!.contents[0] as MarkdownString).value,
                  match: ["vault 1"],
                  nomatch: ["vault 0", "the test note"],
                })
              ).toBeTruthy();
              done();
            },
          });
        });

        test("xvault link to other vault", (done) => {
          let note: NoteProps;
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async (opts) => {
              note = await ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
            },
            onInit: async () => {
              const editor = await WSUtils.openNote(note);
              const provider = new ReferenceHoverProvider();
              const hover = await provider.provideHover(
                editor.document,
                new vscode.Position(8, 4)
              );
              expect(hover).toBeTruthy();
              expect(
                await AssertUtils.assertInString({
                  body: (hover!.contents[0] as MarkdownString).value,
                  match: ["vault 0"],
                  nomatch: ["vault 1", "the test note"],
                })
              ).toBeTruthy();
              done();
            },
          });
        });

        test("xvault link to same vault", (done) => {
          let note: NoteProps;
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async (opts) => {
              note = await ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
            },
            onInit: async () => {
              const editor = await WSUtils.openNote(note);
              const provider = new ReferenceHoverProvider();
              const hover = await provider.provideHover(
                editor.document,
                new vscode.Position(9, 4)
              );
              expect(hover).toBeTruthy();
              expect(
                await AssertUtils.assertInString({
                  body: (hover!.contents[0] as MarkdownString).value,
                  match: ["vault 1"],
                  nomatch: ["vault 0", "the test note"],
                })
              ).toBeTruthy();
              done();
            },
          });
        });

        test("xvault link to non-existant note", (done) => {
          let note: NoteProps;
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async (opts) => {
              note = await ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
            },
            onInit: async () => {
              const editor = await WSUtils.openNote(note);
              const provider = new ReferenceHoverProvider();
              const hover = await provider.provideHover(
                editor.document,
                new vscode.Position(10, 4)
              );
              expect(hover).toBeTruthy();
              expect(
                await AssertUtils.assertInString({
                  body: hover!.contents.join(""),
                  match: ["eggs", "vaultThree", "missing"],
                  nomatch: [
                    "vault 0",
                    "vault 1",
                    "vault1",
                    "vault2",
                    "the test note",
                  ],
                })
              ).toBeTruthy();
              done();
            },
          });
        });

        test("xvault link to non-existant vault", (done) => {
          let note: NoteProps;
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async (opts) => {
              note = await ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
            },
            onInit: async () => {
              const editor = await WSUtils.openNote(note);
              const provider = new ReferenceHoverProvider();
              const hover = await provider.provideHover(
                editor.document,
                new vscode.Position(11, 4)
              );
              expect(hover).toBeTruthy();
              expect(
                await AssertUtils.assertInString({
                  body: hover!.contents.join(""),
                  match: ["vault3", "does not exist"],
                  nomatch: [
                    "vault 0",
                    "vault 1",
                    "vault1",
                    "vault2",
                    "the test note",
                  ],
                })
              ).toBeTruthy();
              done();
            },
          });
        });
      });
    });

    describe("reference", () => {
      test("basic", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "![[target]]",
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
            });
            done();
          },
        });
      });

      test("with xvault", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            // Creating a note of the same name in multiple vaults to check that it gets the right one
            await NoteTestUtilsV4.createNote({
              vault: vaults[1],
              wsRoot,
              fname: "target",
              body: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: "Voluptatem possimus harum nisi.",
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: `![[dendron://${VaultUtils.getName(vaults[1])}/target]]`,
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
              nomatch: ["Voluptatem possimus harum nisi."],
            });
            done();
          },
        });
      });

      test("with header", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Voluptatem possimus harum nisi.",
                "",
                "# Numquam occaecati",
                "",
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: `![[target#numquam-occaecati]]`,
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
              nomatch: ["Voluptatem possimus harum nisi."],
            });
            done();
          },
        });
      });

      test("with block anchor", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Voluptatem possimus harum nisi.",
                "",
                "# Numquam occaecati",
                "",
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima. ^my-anchor",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: `![[target#^my-anchor]]`,
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
              nomatch: ["Voluptatem possimus harum nisi.", "Numquam occaecati"],
            });
            done();
          },
        });
      });

      test("with range", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "target",
              body: [
                "Voluptatem possimus harum nisi.",
                "",
                "# Numquam occaecati",
                "",
                "Sint quo sunt maxime.",
                "",
                "Nisi nam dolorem qui ut minima. ^my-anchor",
                "",
                "Ut quo eius laudantium.",
              ].join("\n"),
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: `![[target#numquam-occaecati:#^my-anchor]]`,
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const hover = await provideForNote(editor);
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: [
                "Numquam occaecati",
                "Sint quo sunt maxime.",
                "Nisi nam dolorem qui ut minima.",
              ],
              nomatch: [
                "Voluptatem possimus harum nisi.",
                "Ut quo eius laudantium.",
              ],
            });
            done();
          },
        });
      });
    });

    test("hashtag", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "tags.foo.test",
            body: "this is tag foo.test",
          });
          await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "source",
            body: "#foo.test",
          });
        },
        onInit: async ({ vaults }) => {
          const editor = await WSUtils.openNoteByPath({
            vault: vaults[0],
            fname: "source",
          });
          const provider = new ReferenceHoverProvider();
          const hover = await provider.provideHover(
            editor.document,
            new vscode.Position(7, 6)
          );
          expect(hover).toBeTruthy();
          await AssertUtils.assertInString({
            body: (hover!.contents[0] as MarkdownString).value,
            match: ["this is tag foo.test"],
          });
          done();
        },
      });
    });

    test("hashtags are ignored when disabled", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "tags.foo.test",
            body: "this is tag foo.test",
          });
          await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "source",
            body: "#foo.test",
          });
        },
        modConfigCb: (config) => {
          config.workspace!.enableHashTags = false;
          return config;
        },
        onInit: async ({ vaults }) => {
          const editor = await WSUtils.openNoteByPath({
            vault: vaults[0],
            fname: "source",
          });
          const provider = new ReferenceHoverProvider();
          const hover = await provider.provideHover(
            editor.document,
            new vscode.Position(7, 6)
          );
          expect(hover).toBeFalsy();
          done();
        },
      });
    });

    test("user tag", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "user.test.mctestface",
            body: "this is user test.mctestface",
          });
          await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "source",
            body: "@test.mctestface",
          });
        },
        onInit: async ({ vaults }) => {
          const editor = await WSUtils.openNoteByPath({
            vault: vaults[0],
            fname: "source",
          });
          const provider = new ReferenceHoverProvider();
          const hover = await provider.provideHover(
            editor.document,
            new vscode.Position(7, 6)
          );
          expect(hover).toBeTruthy();
          await AssertUtils.assertInString({
            body: (hover!.contents[0] as MarkdownString).value,
            match: ["this is user test.mctestface"],
          });
          done();
        },
      });
    });

    test("user tags are ignored when disabled", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "user.test.mctestface",
            body: "this is user test.mctestface",
          });
          await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "source",
            body: "@test.mctestface",
          });
        },
        modConfigCb: (config) => {
          config.workspace!.enableUserTags = false;
          return config;
        },
        onInit: async ({ vaults }) => {
          const editor = await WSUtils.openNoteByPath({
            vault: vaults[0],
            fname: "source",
          });
          const provider = new ReferenceHoverProvider();
          const hover = await provider.provideHover(
            editor.document,
            new vscode.Position(7, 6)
          );
          expect(hover).toBeFalsy();
          done();
        },
      });
    });

    describe("frontmatter tags", () => {
      test("single tag", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "tags.foo.test",
              body: "this is tag foo.test",
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              props: {
                tags: "foo.test",
              },
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(6, 10)
            );
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: ["this is tag foo.test"],
            });
            done();
          },
        });
      });

      test("multiple tags", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "tags.foo.test",
              body: "this is tag foo.test",
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "tags.foo.bar",
              body: "this is the wrong tag",
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "tags.foo.baz",
              body: "this is the wrong tag",
            });
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              props: {
                tags: ["foo.bar", "foo.test", "foo.baz"],
              },
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(8, 4)
            );
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: (hover!.contents[0] as MarkdownString).value,
              match: ["this is tag foo.test"],
            });
            done();
          },
        });
      });
    });

    describe("non-note", () => {
      test("image", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await fs.ensureFile(
              path.join(
                wsRoot,
                VaultUtils.getName(vaults[0]),
                "assets",
                "image.png"
              )
            );
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "![[/assets/image.png]]",
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(7, 4)
            );
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: hover!.contents.join(""),
              match: ["[", "]", "(", "/assets/image.png", ")"],
            });
            done();
          },
        });
      });

      test("hyperlink", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "![[http://example.com]]",
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(7, 4)
            );
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: hover!.contents.join(""),
              match: ["[", "]", "(", "http://example.com", ")"],
            });
            done();
          },
        });
      });

      test("email", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: "![[mailto:user@example.com]]",
            });
          },
          onInit: async ({ vaults }) => {
            const editor = await WSUtils.openNoteByPath({
              vault: vaults[0],
              fname: "source",
            });
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(7, 4)
            );
            expect(hover).toBeTruthy();
            await AssertUtils.assertInString({
              body: hover!.contents.join(""),
              match: ["[", "]", "(", "mailto:user@example.com", ")"],
            });
            done();
          },
        });
      });

      describeMultiWS("GIVEN link to non-existent note", {}, () => {
        before(async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const note = await NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "source",
            body: ["[[foo.bar.baz]]", "[[foo.bar..baz]]"].join("\n"),
          });
          await ExtensionProvider.getWSUtils().openNote(note);
        });
        describe("WHEN filename is valid", () => {
          const position = new vscode.Position(7, 4);
          test("THEN display message to create it with go to note", async () => {
            const editor = VSCodeUtils.getActiveTextEditorOrThrow();
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              position
            );
            expect(hover).toBeTruthy();
            expect(
              await AssertUtils.assertInString({
                body: hover!.contents.join(""),
                match: [
                  'Note foo.bar.baz is missing, use "Dendron: Go to Note" command to create it.',
                ],
              })
            ).toBeTruthy();
          });
        });

        describe("WHEN filename is invalid", () => {
          const position = new vscode.Position(8, 4);
          test("THEN display invalid filename warning and suggestion", async () => {
            const editor = VSCodeUtils.getActiveTextEditorOrThrow();
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              position
            );
            expect(hover).toBeTruthy();
            expect(
              await AssertUtils.assertInString({
                body: (hover!.contents[0] as MarkdownString).value,
                match: [
                  "Note `foo.bar..baz` is missing, and the filename is invalid for the following reason:\n\n `Hierarchies cannot be empty strings`.\n\n Maybe you meant `foo.bar.baz`?",
                ],
              })
            ).toBeTruthy();
          });
        });
      });

      describeSingleWS(
        "WHEN used on a link to a non-note file",
        { ctx },
        () => {
          before(async () => {
            const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
            await fs.writeFile(
              path.join(wsRoot, "test.txt"),
              "Et nam velit laboriosam."
            );
            const note = await NoteTestUtilsV4.createNote({
              vault: vaults[0],
              wsRoot,
              fname: "source",
              body: ["[[test.txt]]", "[[test.txt#L1]]"].join("\n"),
            });
            await WSUtils.openNote(note);
          });

          test("THEN displays message to open it with the default app", async () => {
            const editor = VSCodeUtils.getActiveTextEditorOrThrow();
            const provider = new ReferenceHoverProvider();
            const hover = await provider.provideHover(
              editor.document,
              new vscode.Position(7, 4)
            );
            expect(hover).toBeTruthy();
            expect(
              await AssertUtils.assertInString({
                body: hover!.contents.join(""),
                match: ["test.txt"],
              })
            ).toBeTruthy();
          });

          describe("AND the link has a line anchor", () => {
            test("THEN displays message to open it with the default app", async () => {
              const editor = VSCodeUtils.getActiveTextEditorOrThrow();
              const provider = new ReferenceHoverProvider();
              const hover = await provider.provideHover(
                editor.document,
                new vscode.Position(8, 4)
              );
              expect(hover).toBeTruthy();
              expect(
                await AssertUtils.assertInString({
                  body: hover!.contents.join(""),
                  match: ["test.txt"],
                  nomatch: ["L6"],
                })
              ).toBeTruthy();
            });
          });
        }
      );
    });
  });
});
