import { NoteProps, SchemaTemplate, VaultUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  runMochaHarness,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, before, beforeEach, describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { GotoNoteCommand } from "../../commands/GotoNote";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { PluginFileUtils } from "../../utils/files";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getDWorkspace, getExtension } from "../../workspace";
import { WSUtils } from "../../WSUtils";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { getActiveEditorBasename } from "../testUtils";
import { expect, LocationTestUtils } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

const { ANCHOR_WITH_SPECIAL_CHARS, ANCHOR } = GOTO_NOTE_PRESETS;

function createGoToNoteCmd() {
  return new GotoNoteCommand(getExtension());
}

suite("GotoNote", function () {
  describe("new style tests", () => {
    const preSetupHook = ENGINE_HOOKS.setupBasic;

    describeMultiWS(
      "WHEN pass in note",
      {
        preSetupHook,
      },
      () => {
        test("THEN goto note", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          const note = engine.notes["foo"];
          const { note: out } = (await createGoToNoteCmd().run({
            qs: "foo",
            vault,
          })) as { note: NoteProps };
          expect(out).toEqual(note);
          expect(getActiveEditorBasename()).toEqual("foo.md");
        });
      }
    );

    describeMultiWS(
      "WHEN goto stub",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          const vpath = vault2Path({ vault, wsRoot });
          fs.removeSync(path.join(vpath, "foo.md"));
        },
      },
      () => {
        test("THEN get note", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          const note = (await engine.findNotes({ fname: "foo", vault }))[0];
          expect(_.pick(note, ["fname", "stub"])).toEqual({
            fname: "foo",
            stub: true,
          });

          const { note: out } = (await createGoToNoteCmd().run({
            qs: "foo",
            vault,
          })) as { note: NoteProps };
          expect(_.pick(out, ["fname", "stub", "id"])).toEqual({
            fname: "foo",
            id: note.id,
          });
          expect(getActiveEditorBasename()).toEqual("foo.md");
        });
      }
    );

    describeMultiWS(
      "WHEN goto new note",
      {
        preSetupHook,
      },
      () => {
        test("THEN note created", async () => {
          const { vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          const { note: out } = (await createGoToNoteCmd().run({
            qs: "foo.ch2",
            vault,
          })) as { note: NoteProps };
          expect(_.pick(out, ["fname", "stub"])).toEqual({
            fname: "foo.ch2",
          });
          expect(getActiveEditorBasename()).toEqual("foo.ch2.md");
        });
      }
    );

    describeMultiWS(
      "WHEN goto note with template",
      {
        preSetupHook,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
        },
      },
      () => {
        test("THEN apply template", async () => {
          const { vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          await createGoToNoteCmd().run({
            qs: "bar.ch1",
            vault,
          });
          expect(getActiveEditorBasename()).toEqual("bar.ch1.md");
          const content =
            VSCodeUtils.getActiveTextEditor()?.document.getText() as string;
          expect(content.indexOf("ch1 template") >= 0).toBeTruthy();
        });
      }
    );

    describeMultiWS(
      "GIVEN a new note and a template in different vaults",
      {
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
        },
      },
      () => {
        test("THEN new note uses that template", async () => {
          // Template is in vault 1. Note is in vault 2
          const { vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[1];
          await createGoToNoteCmd().run({
            qs: "bar.ch1",
            vault,
          });
          expect(getActiveEditorBasename()).toEqual("bar.ch1.md");
          const content =
            VSCodeUtils.getActiveTextEditor()?.document.getText() as string;
          expect(content.indexOf("ch1 template") >= 0).toBeTruthy();
        });
      }
    );

    describeMultiWS(
      "GIVEN a new note and multiple templates in different vaults with the same name",
      {
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Template is in vault 1 and 3
          await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vaultThree",
            fname: "bar.template.ch1",
            vault: vaults[2],
          });
        },
      },
      () => {
        let showQuickPick: sinon.SinonStub;

        beforeEach(() => {
          showQuickPick = sinon.stub(vscode.window, "showQuickPick");
        });
        afterEach(() => {
          showQuickPick.restore();
        });

        test("AND user picks from prompted vault, THEN template body gets applied to new note", async () => {
          // Try to create note in vault 3
          const { vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[2];
          // Pick vault 2
          showQuickPick.onFirstCall().returns(
            Promise.resolve({
              label: "vaultThree",
              vault: vaults[2],
            }) as Thenable<vscode.QuickPickItem>
          );
          await createGoToNoteCmd().run({
            qs: "bar.ch1",
            vault,
          });
          expect(getActiveEditorBasename()).toEqual("bar.ch1.md");
          const content =
            VSCodeUtils.getActiveTextEditor()?.document.getText() as string;
          expect(
            content.indexOf("food ch2 template in vaultThree") >= 0
          ).toBeTruthy();
        });
      }
    );

    describeMultiWS(
      "GIVEN a new note and multiple templates in different vaults with the same name",
      {
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Schema is in vault1 and specifies template in vault 2
          const vault = vaults[0];
          // Template is in vault2 and vaultThree
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vault 2",
            fname: "template.ch2",
            vault: vaults[1],
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vaultThree",
            fname: "template.ch2",
            vault: vaults[2],
          });
          const template: SchemaTemplate = {
            id: `dendron://${VaultUtils.getName(vaults[1])}/template.ch2`,
            type: "note",
          };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        test("WHEN schema template uses xvault notation, THEN correct template body gets applied to new note", async () => {
          // Try to create note in vault 3
          const { vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[2];
          await createGoToNoteCmd().run({
            qs: "food.ch2",
            vault,
          });
          expect(getActiveEditorBasename()).toEqual("food.ch2.md");
          const content =
            VSCodeUtils.getActiveTextEditor()?.document.getText() as string;
          expect(
            content.indexOf("food ch2 template in vault 2") >= 0
          ).toBeTruthy();
        });
      }
    );

    describeMultiWS(
      "WHEN goto note with anchor",
      {
        preSetupHook: async (opts) => {
          await ANCHOR.preSetupHook(opts);
        },
      },
      () => {
        test("THEN goto anchor", async () => {
          const { vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          await createGoToNoteCmd().run({
            qs: "alpha",
            vault,
            anchor: {
              type: "header",
              value: "H3",
            },
          });
          expect(getActiveEditorBasename()).toEqual("alpha.md");
          const selection = VSCodeUtils.getActiveTextEditor()?.selection;
          expect(selection?.start.line).toEqual(9);
          expect(selection?.start.character).toEqual(0);
        });
      }
    );

    describeMultiWS(
      "WHEN go to note header with wikilink and unicode characters",
      {
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "target-note",
            body: "\n\n## Lörem [[Foo：Bar🙂Baz|foo：bar🙂baz]] Ipsum\n\nlorem ipsum",
          });
        },
      },
      () => {
        test("THEN goto ehader", async () => {
          const { vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          await createGoToNoteCmd().run({
            qs: "target-note",
            vault,
            anchor: {
              type: "header",
              value: "lörem-foo：barbaz-ipsum",
            },
          });
          expect(getActiveEditorBasename()).toEqual("target-note.md");
          const selection = VSCodeUtils.getActiveTextEditor()?.selection;
          expect(selection?.start.line).toEqual(9);
          expect(selection?.start.character).toEqual(0);
        });
      }
    );

    let specialCharsHeader: string;
    describeMultiWS(
      "WHEN anchor with special chars",
      {
        preSetupHook: async (opts) => {
          ({ specialCharsHeader } =
            await ANCHOR_WITH_SPECIAL_CHARS.preSetupHook(opts));
        },
      },
      () => {
        test("THEN goto anchor", async () => {
          const { vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          await createGoToNoteCmd().run({
            qs: "alpha",
            vault,
            anchor: {
              type: "header",
              value: specialCharsHeader,
            },
          });
          expect(getActiveEditorBasename()).toEqual("alpha.md");
          const selection = VSCodeUtils.getActiveTextEditor()?.selection;
          expect(selection?.start.line).toEqual(9);
          expect(selection?.start.character).toEqual(0);
        });
      }
    );
  });

  const ctx = setupBeforeAfter(this, {});
  describe("using args", () => {
    test("block anchor", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          await createGoToNoteCmd().run({
            qs: "anchor-target",
            vault,
            anchor: {
              type: "block",
              value: "block-id",
            },
          });
          expect(getActiveEditorBasename()).toEqual("anchor-target.md");
          const selection = VSCodeUtils.getActiveTextEditor()?.selection;
          expect(selection?.start.line).toEqual(10);
          expect(selection?.start.character).toEqual(0);
          done();
        },
      });
    });

    test("hashtag", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          // Create a note with a hashtag in it
          note = await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "test.note",
            body: "#my.test-0.tag",
          });
        },
        onInit: async () => {
          // Open the note, select the hashtag, and use the command
          await WSUtils.openNote(note);
          VSCodeUtils.getActiveTextEditorOrThrow().selection =
            new vscode.Selection(
              new vscode.Position(7, 1),
              new vscode.Position(7, 1)
            );
          await createGoToNoteCmd().run();
          // Make sure this took us to the tag note
          expect(getActiveEditorBasename()).toEqual("tags.my.test-0.tag.md");
          done();
        },
      });
    });

    test("user tag", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          // Create a note with a hashtag in it
          note = await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "test.note",
            body: "@test.mctestface",
          });
        },
        onInit: async () => {
          // Open the note, select the hashtag, and use the command
          await WSUtils.openNote(note);
          VSCodeUtils.getActiveTextEditorOrThrow().selection =
            new vscode.Selection(
              new vscode.Position(7, 1),
              new vscode.Position(7, 1)
            );
          await createGoToNoteCmd().run();
          // Make sure this took us to the tag note
          expect(getActiveEditorBasename()).toEqual("user.test.mctestface.md");
          done();
        },
      });
    });

    describe("frontmatter tags", () => {
      test("single tag", (done) => {
        let note: NoteProps;
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            // Create a note with a hashtag in it
            note = await NoteTestUtilsV4.createNote({
              wsRoot,
              vault: vaults[0],
              fname: "test.note",
              props: {
                tags: "my.test-0.tag",
              },
            });
          },
          onInit: async () => {
            // Open the note, select the hashtag, and use the command
            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(
                new vscode.Position(6, 8),
                new vscode.Position(6, 8)
              );
            await createGoToNoteCmd().run();
            // Make sure this took us to the tag note
            expect(getActiveEditorBasename()).toEqual("tags.my.test-0.tag.md");
            done();
          },
        });
      });

      test("tag containing space", (done) => {
        let note: NoteProps;
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            // Create a note with a hashtag in it
            note = await NoteTestUtilsV4.createNote({
              wsRoot,
              vault: vaults[0],
              fname: "test.note",
              props: {
                tags: "one ",
              },
            });
          },
          onInit: async () => {
            // Open the note, select the hashtag, and use the command
            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(
                new vscode.Position(6, 8),
                new vscode.Position(6, 8)
              );
            await createGoToNoteCmd().run();
            // Make sure this took us to the tag note
            expect(getActiveEditorBasename()).toEqual("tags.one.md");
            done();
          },
        });
      });

      test("multiple tags", (done) => {
        let note: NoteProps;
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            // Create a note with a hashtag in it
            note = await NoteTestUtilsV4.createNote({
              wsRoot,
              vault: vaults[0],
              fname: "test.note",
              props: {
                tags: ["foo", "my.test-0.tag", "bar"],
              },
            });
          },
          onInit: async () => {
            // Open the note, select the hashtag, and use the command
            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(
                new vscode.Position(8, 6),
                new vscode.Position(8, 6)
              );
            await createGoToNoteCmd().run();
            // Make sure this took us to the tag note
            expect(getActiveEditorBasename()).toEqual("tags.my.test-0.tag.md");
            done();
          },
        });
      });
    });
  });

  describe("using selection", () => {
    describeMultiWS(
      "WHEN link in code block",
      {
        preSetupHook: GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.preSetupHook,
      },
      () => {
        test("THEN opens the note", async () => {
          const ext = ExtensionProvider.getExtension();
          await GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.beforeTestResults({ ext });
          await createGoToNoteCmd().run();
          await runMochaHarness(GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.results);
        });
      }
    );

    test("xvault", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS_MULTI.setupLinksMulti(opts);
        },
        onInit: async ({ engine, vaults }) => {
          const note = engine.notes[NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname];
          const editor = await WSUtils.openNote(note);
          const linkPos = LocationTestUtils.getPresetWikiLinkPosition();
          editor.selection = new vscode.Selection(linkPos, linkPos);
          // foo.ch1.md
          await createGoToNoteCmd().run({});
          const editor2 = VSCodeUtils.getActiveTextEditorOrThrow();
          const suffix =
            path.join(
              vaults[1].fsPath,
              NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.fname
            ) + ".md";
          expect(editor2.document.uri.fsPath.endsWith(suffix)).toBeTruthy();
          done();
        },
      });
    });

    describe("multiple notes & xvault link", () => {
      test("non-xvault link prompts for vault", (done) => {
        let note: NoteProps;
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async (opts) => {
            note = await ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
          },
          onInit: async ({ vaults, wsRoot }) => {
            const prompt = sinon
              .stub(PickerUtilsV2, "promptVault")
              .returns(Promise.resolve(vaults[1]));
            try {
              const editor = await WSUtils.openNote(note);
              editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
                line: 7,
              });
              await createGoToNoteCmd().run();
              const openedNote = WSUtils.getNoteFromDocument(
                VSCodeUtils.getActiveTextEditorOrThrow().document
              );
              expect(openedNote?.fname).toEqual("eggs");
              expect(
                VaultUtils.isEqual(openedNote!.vault, vaults[1], wsRoot)
              ).toBeTruthy();
              expect(prompt.calledOnce).toBeTruthy();
              done();
            } finally {
              prompt.restore();
            }
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
          onInit: async ({ vaults, wsRoot }) => {
            const editor = await WSUtils.openNote(note);
            editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
              line: 8,
            });
            await createGoToNoteCmd().run();
            const openedNote = WSUtils.getNoteFromDocument(
              VSCodeUtils.getActiveTextEditorOrThrow().document
            );
            expect(openedNote?.fname).toEqual("eggs");
            expect(
              VaultUtils.isEqual(openedNote!.vault, vaults[0], wsRoot)
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
          onInit: async ({ vaults, wsRoot }) => {
            const editor = await WSUtils.openNote(note);
            editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
              line: 9,
            });
            await createGoToNoteCmd().run();
            const openedNote = WSUtils.getNoteFromDocument(
              VSCodeUtils.getActiveTextEditorOrThrow().document
            );
            expect(openedNote?.fname).toEqual("eggs");
            expect(
              VaultUtils.isEqual(openedNote!.vault, vaults[1], wsRoot)
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
          onInit: async ({ vaults, wsRoot }) => {
            const editor = await WSUtils.openNote(note);
            editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
              line: 10,
            });
            await createGoToNoteCmd().run();
            const openedNote = WSUtils.getNoteFromDocument(
              VSCodeUtils.getActiveTextEditorOrThrow().document
            );
            // Should have created the note in this vault
            expect(openedNote?.fname).toEqual("eggs");
            expect(
              VaultUtils.isEqual(openedNote!.vault, vaults[2], wsRoot)
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
          onInit: async ({ vaults, wsRoot }) => {
            const editor = await WSUtils.openNote(note);
            editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
              line: 11,
            });
            await createGoToNoteCmd().run();
            const openedNote = WSUtils.getNoteFromDocument(
              VSCodeUtils.getActiveTextEditorOrThrow().document
            );
            // Should not have changed notes
            expect(openedNote?.fname).toEqual("test");
            expect(
              VaultUtils.isEqual(openedNote!.vault, vaults[1], wsRoot)
            ).toBeTruthy();
            done();
          },
        });
      });
    });

    test("xvault with multiple matches", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS_MULTI.setupLinksMulti(opts);
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
            vault: opts.vaults[2],
            wsRoot: opts.wsRoot,
            genRandomId: true,
          });
        },
        onInit: async ({ engine, vaults }) => {
          sinon
            .stub(PickerUtilsV2, "promptVault")
            .returns(Promise.resolve(vaults[1]));
          const note = engine.notes[NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname];
          const editor = await WSUtils.openNote(note);
          const linkPos = LocationTestUtils.getPresetWikiLinkPosition();
          editor.selection = new vscode.Selection(linkPos, linkPos);
          await createGoToNoteCmd().run({});
          const editor2 = VSCodeUtils.getActiveTextEditorOrThrow();
          const suffix =
            path.join(
              vaults[1].fsPath,
              NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.fname
            ) + ".md";
          expect(editor2.document.uri.fsPath.endsWith(suffix)).toBeTruthy();
          done();
        },
      });
    });

    test("multi-link in same line", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
          const { wsRoot } = opts;
          const vault = opts.vaults[0];
          await NoteTestUtilsV4.modifyNoteByPath(
            { wsRoot, vault, fname: "foo" },
            (note) => {
              note.body =
                "this is a [[foolink]]. this is another link [[foo.ch1]]";
              return note;
            }
          );
        },
        onInit: async ({ engine, vaults }) => {
          const note = engine.notes["foo"];
          const editor = await WSUtils.openNote(note);
          // put cursor in location on 48
          editor.selection = new vscode.Selection(
            new vscode.Position(7, 48),
            new vscode.Position(7, 48)
          );
          // foo.ch1.md
          await createGoToNoteCmd().run({
            vault: vaults[0],
          });
          expect(getActiveEditorBasename()).toEqual("foo.ch1.md");
          done();
        },
      });
    });

    describe("GIVEN non-note files", () => {
      describeMultiWS("WHEN used on a link to a non-note file", { ctx }, () => {
        before(async () => {
          const { wsRoot, vaults } = getDWorkspace();
          await fs.writeFile(
            path.join(wsRoot, "test.txt"),
            "Et voluptatem autem sunt."
          );
          await fs.ensureDir(
            path.join(wsRoot, VaultUtils.getRelPath(vaults[1]), "assets")
          );
          await fs.writeFile(
            path.join(
              wsRoot,
              VaultUtils.getRelPath(vaults[1]),
              "assets",
              "test.txt"
            ),
            "Et hic est voluptatem eum quia quas pariatur."
          );
        });

        test("THEN opens the non-note file", async () => {
          const { vaults, wsRoot, engine } = getDWorkspace();
          const note = await NoteTestUtilsV4.createNoteWithEngine({
            wsRoot,
            vault: vaults[0],
            fname: "test.note",
            body: "[[/test.txt]]",
            engine,
          });

          await WSUtils.openNote(note);
          VSCodeUtils.getActiveTextEditorOrThrow().selection =
            new vscode.Selection(7, 1, 7, 1);
          await createGoToNoteCmd().run();

          expect(getActiveEditorBasename()).toEqual("test.txt");
          expect(
            VSCodeUtils.getActiveTextEditorOrThrow().document.getText().trim()
          ).toEqual("Et voluptatem autem sunt.");
        });

        describe("AND the link doesn't include a slash", () => {
          before(async () => {
            const { vaults, wsRoot, engine } = getDWorkspace();
            const note = await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "test.note",
              body: "[[test.txt]]",
              engine,
            });

            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(7, 1, 7, 1);
            await createGoToNoteCmd().run();
          });

          test("THEN opens the non-note file", async () => {
            expect(getActiveEditorBasename()).toEqual("test.txt");
            expect(
              VSCodeUtils.getActiveTextEditorOrThrow().document.getText().trim()
            ).toEqual("Et voluptatem autem sunt.");
          });
        });

        describe("AND the link starts with assets", () => {
          before(async () => {
            const { vaults, wsRoot, engine } = getDWorkspace();
            const note = await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "test.note2",
              body: "[[assets/test.txt]]",
              engine,
            });

            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(7, 1, 7, 1);
            await createGoToNoteCmd().run();
          });

          test("THEN opens the non-note file inside assets", async () => {
            expect(getActiveEditorBasename()).toEqual("test.txt");
            expect(
              VSCodeUtils.getActiveTextEditorOrThrow().document.getText().trim()
            ).toEqual("Et hic est voluptatem eum quia quas pariatur.");
          });
        });
      });

      describeMultiWS(
        "WHEN there's a note and non-note file with the same name",
        { ctx },
        () => {
          before(async () => {
            const { wsRoot, vaults, engine } = getDWorkspace();
            const note = await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "test.note",
              body: "[[test.txt]]",
              engine,
            });
            await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "test.txt",
              body: "Accusantium id et sunt cum esse.",
              engine,
            });
            await fs.writeFile(
              path.join(wsRoot, "test.txt"),
              "Et voluptatem autem sunt."
            );

            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(7, 1, 7, 1);
            await createGoToNoteCmd().run();
          });

          test("THEN opens the note", async () => {
            expect(getActiveEditorBasename()).toEqual("test.txt.md");
            expect(
              AssertUtils.assertInString({
                body: VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
                match: ["Accusantium id et sunt cum esse."],
                nomatch: ["Voluptatibus et totam qui eligendi qui quaerat."],
              })
            ).toBeTruthy();
          });
        }
      );

      describeMultiWS(
        "WHEN linked to a specific line inside of that file",
        { ctx },
        () => {
          before(async () => {
            const { wsRoot, vaults, engine } = getDWorkspace();
            const note = await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "test.note",
              body: "[[test.txt#L3]]",
              engine,
            });
            await fs.writeFile(
              path.join(wsRoot, "test.txt"),
              [
                "Aut fugit eos sint eos explicabo.",
                "Ut dolores fugit qui deserunt.",
                "Animi et recusandae in blanditiis sapiente.",
                "Consequatur est repellat non.",
              ].join("\n")
            );

            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(7, 1, 7, 1);
            await createGoToNoteCmd().run();
          });

          test("THEN opens the file at that line", async () => {
            expect(getActiveEditorBasename()).toEqual("test.txt");
            expect(
              AssertUtils.assertInString({
                body: VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
                match: ["Animi et recusandae in blanditiis sapiente."],
              })
            ).toBeTruthy();
            expect(
              VSCodeUtils.getActiveTextEditorOrThrow().selection.start.line
              // Link is 1-indexed, while VSCode is 0-indexed
            ).toEqual(2);
          });
        }
      );

      describeMultiWS(
        "WHEN linked to a file starting with a dot",
        { ctx },
        () => {
          before(async () => {
            const { wsRoot, vaults, engine } = getDWorkspace();
            const note = await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "test.note",
              body: "[[.test/file.txt]]",
              engine,
            });
            await fs.ensureDir(path.join(wsRoot, ".test"));
            await fs.writeFile(
              path.join(wsRoot, ".test", "file.txt"),
              ["Et corporis assumenda quia libero illo."].join("\n")
            );

            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(7, 1, 7, 1);
            await createGoToNoteCmd().run();
          });

          test("THEN opens that file", async () => {
            expect(getActiveEditorBasename()).toEqual("file.txt");
            expect(
              AssertUtils.assertInString({
                body: VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
                match: ["Et corporis assumenda quia libero illo."],
              })
            ).toBeTruthy();
          });
        }
      );

      describeMultiWS("WHEN linked to a binary file", { ctx }, () => {
        const filename = "test.zip";
        const notename = "test.note";
        let openWithDefaultApp: sinon.SinonStub<[string], Promise<void>>;
        before(async () => {
          const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
          const note = await NoteTestUtilsV4.createNoteWithEngine({
            wsRoot,
            vault: vaults[0],
            fname: notename,
            body: `[[/${filename}]]`,
            engine,
          });
          await fs.writeFile(path.join(wsRoot, filename), "");
          openWithDefaultApp = sinon.stub(
            PluginFileUtils,
            "openWithDefaultApp"
          );

          await ExtensionProvider.getWSUtils().openNote(note);
          VSCodeUtils.getActiveTextEditorOrThrow().selection =
            new vscode.Selection(7, 1, 7, 1);
          await createGoToNoteCmd().run();
        });

        test("THEN opens that file in the default app", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          // The open note didn't change
          expect(getActiveEditorBasename().startsWith(notename)).toBeTruthy();
          // Used the stubbed function to open in default app
          expect(
            openWithDefaultApp.calledOnceWith(path.join(wsRoot, filename))
          );
        });
      });

      describeMultiWS(
        "WHEN linked to a file under assets where assets is in root and not a vault",
        { ctx },
        () => {
          before(async () => {
            const { wsRoot, vaults, engine } = getDWorkspace();
            const note = await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "test.note",
              body: "[[assets/file.txt]]",
              engine,
            });
            await fs.ensureDir(path.join(wsRoot, "assets"));
            await fs.writeFile(
              path.join(wsRoot, "assets", "file.txt"),
              ["Dolorum sed earum enim rem expedita nemo."].join("\n")
            );

            await WSUtils.openNote(note);
            VSCodeUtils.getActiveTextEditorOrThrow().selection =
              new vscode.Selection(7, 1, 7, 1);
            await createGoToNoteCmd().run();
          });

          test("THEN opens that file", async () => {
            expect(getActiveEditorBasename()).toEqual("file.txt");
            expect(
              AssertUtils.assertInString({
                body: VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
                match: ["Dolorum sed earum enim rem expedita nemo."],
              })
            ).toBeTruthy();
          });
        }
      );
    });
  });
});
