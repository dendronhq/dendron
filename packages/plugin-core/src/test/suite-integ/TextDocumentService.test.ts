import {
  assert,
  milliseconds,
  NoteChangeEntry,
  NoteChangeUpdateEntry,
} from "@dendronhq/common-all";
import { genHash } from "@dendronhq/common-server";
import {
  NoteTestUtilsV4,
  testAssertsInsideCallback,
} from "@dendronhq/common-test-utils";
import {
  ENGINE_HOOKS,
  extractNoteChangeEntriesByType,
} from "@dendronhq/engine-test-utils";
import { afterEach, describe } from "mocha";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { TextDocumentService } from "../../services/TextDocumentService";
import { expect } from "../testUtilsv2";
import {
  describeSingleWS,
  describeMultiWS,
  subscribeToEngineStateChange,
} from "../testUtilsV3";

async function wait1Millisecond(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1);
  });
}

/**
 * Returns current milliseconds and waits 1 millisecond to ensure
 * subsequent calls to this function will return different milliseconds. */
async function millisNowAndWait1Milli(): Promise<number> {
  const millis = milliseconds();
  await wait1Millisecond();
  return millis;
}

suite("TextDocumentService", function testSuite() {
  let textDocumentService: TextDocumentService | undefined;
  let onDidChangeTextDocumentHandler: vscode.Disposable | undefined;
  this.timeout(5000);

  afterEach(() => {
    if (textDocumentService) {
      textDocumentService.dispose();
    }
    if (onDidChangeTextDocumentHandler) {
      onDidChangeTextDocumentHandler.dispose();
    }
  });

  describe("Given a TextDocumentChangeEvent", () => {
    describeSingleWS(
      "WHEN the contents have changed",
      {
        postSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault,
            fname: "alpha",
            body: "First Line\n",
          });
        },
      },
      () => {
        test("THEN processTextDocumentChangeEvent should return note with updated text", (done) => {
          textDocumentService = new TextDocumentService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument
          );
          const textToAppend = "new text here";
          const engine = ExtensionProvider.getEngine();
          const alphaNote = engine.notes["alpha"];

          onDidChangeTextDocumentHandler =
            vscode.workspace.onDidChangeTextDocument(async (event) => {
              if (event.document.isDirty) {
                const maybeNote =
                  await textDocumentService?.processTextDocumentChangeEvent(
                    event
                  );
                expect(maybeNote?.body).toEqual("First Line\n" + textToAppend);
                // Make sure updated has not changed
                expect(maybeNote?.updated).toEqual(alphaNote.updated);
                done();
              }
            });
          ExtensionProvider.getWSUtils()
            .openNote(alphaNote)
            .then((editor) => {
              editor.edit((editBuilder) => {
                const line = editor.document.getText().split("\n").length;
                editBuilder.insert(new vscode.Position(line, 0), textToAppend);
              });
            });
        });
      }
    );

    describeSingleWS(
      "WHEN the contents have changed tags",
      {
        postSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            fname: "foo",
            wsRoot,
            vault,
            body: "foo body",
          });
          await NoteTestUtilsV4.createNote({
            fname: "tags.test",
            wsRoot,
            vault,
          });
        },
      },
      () => {
        test("THEN processTextDocumentChangeEvent should return note with updated links", (done) => {
          textDocumentService = new TextDocumentService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument
          );
          const engine = ExtensionProvider.getEngine();
          const foo = engine.notes["foo"];

          onDidChangeTextDocumentHandler =
            vscode.workspace.onDidChangeTextDocument(async (event) => {
              if (event.document.isDirty) {
                const maybeNote =
                  await textDocumentService?.processTextDocumentChangeEvent(
                    event
                  );
                expect(maybeNote?.links.length).toEqual(1);
                expect(maybeNote?.links[0].type).toEqual("frontmatterTag");
                expect(maybeNote?.links[0].to?.fname).toEqual("tags.test");
                done();
              }
            });
          ExtensionProvider.getWSUtils()
            .openNote(foo)
            .then((editor) => {
              editor.edit((editBuilder) => {
                const pos = new vscode.Position(6, 0);
                editBuilder.insert(pos, `tags: test\n`);
              });
            });
        });
      }
    );

    describeSingleWS(
      "WHEN the editor has not changed contents",
      {
        postSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault,
            fname: "beta",
            body: "First Line\n",
          });
        },
      },
      () => {
        test("THEN processTextDocumentChangeEvent should not be called", (done) => {
          textDocumentService = new TextDocumentService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument
          );
          const engine = ExtensionProvider.getEngine();
          const currentNote = engine.notes["beta"];

          onDidChangeTextDocumentHandler =
            vscode.workspace.onDidChangeTextDocument(() => {
              assert(false, "Callback not expected");
            });
          ExtensionProvider.getWSUtils()
            .openNote(currentNote)
            .then((editor) => {
              editor.edit((editBuilder) => {
                const line = editor.document.getText().split("\n").length;
                editBuilder.insert(new vscode.Position(line, 0), "");
              });
            });
          // Small sleep to ensure callback doesn't fire.
          millisNowAndWait1Milli().then(() => done());
        });
      }
    );

    describeSingleWS(
      "WHEN the contents of the event are the same as what's in the engine",
      {
        postSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault,
            fname: "beta",
            body: "First Line\n",
          });
        },
      },
      () => {
        test("THEN processTextDocumentChangeEvent should return original note", (done) => {
          textDocumentService = new TextDocumentService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument
          );

          const engine = ExtensionProvider.getEngine();
          const currentNote = engine.notes["beta"];

          onDidChangeTextDocumentHandler =
            vscode.workspace.onDidChangeTextDocument(async (event) => {
              if (event.document.isDirty) {
                // Set content hash to be same as event to enter content no change logic
                currentNote.contentHash = genHash(event.document.getText());

                const maybeNote =
                  await textDocumentService?.processTextDocumentChangeEvent(
                    event
                  );
                expect(maybeNote).toEqual(currentNote);
                done();
              }
            });
          ExtensionProvider.getWSUtils()
            .openNote(currentNote)
            .then((editor) => {
              editor.edit((editBuilder) => {
                const line = editor.document.getText().split("\n").length;
                editBuilder.insert(new vscode.Position(line, 0), "1");
              });
            });
        });
      }
    );

    describeSingleWS("WHEN the contents don't match any notes", {}, () => {
      test("THEN processTextDocumentChangeEvent should return undefined", (done) => {
        textDocumentService = new TextDocumentService(
          ExtensionProvider.getExtension(),
          vscode.workspace.onDidSaveTextDocument
        );
        const textToAppend = "new text here";
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();

        NoteTestUtilsV4.createNote({
          fname: "blahblah123",
          body: `[[beta]]`,
          vault: vaults[0],
          wsRoot,
        }).then((testNoteProps) => {
          ExtensionProvider.getWSUtils()
            .openNote(testNoteProps)
            .then((editor) => {
              editor.edit((editBuilder) => {
                const line = editor.document.getText().split("\n").length;
                editBuilder.insert(new vscode.Position(line, 0), textToAppend);
              });
            });
        });

        expect(engine.notes["blahblah123"]).toBeFalsy();

        onDidChangeTextDocumentHandler =
          vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (event.document.isDirty) {
              const maybeNote =
                await textDocumentService?.processTextDocumentChangeEvent(
                  event
                );
              expect(maybeNote).toBeFalsy();
              done();
            }
          });
      });
    });
  });

  describe("GIVEN a vscode.workspace.onDidSaveTextDocument event is fired", () => {
    describeSingleWS(
      "WHEN the contents of the note has changed",
      {
        postSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN engine note contents should be updated", async () => {
          textDocumentService = new TextDocumentService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument
          );
          const engine = ExtensionProvider.getEngine();
          const testNoteProps = engine.notes["foo"];
          const editor = await ExtensionProvider.getWSUtils().openNote(
            testNoteProps
          );

          const textToAppend = "new text here";
          editor.edit((editBuilder) => {
            const line = editor.document.getText().split("\n").length;
            editBuilder.insert(new vscode.Position(line, 0), textToAppend);
          });
          await editor.document.save();

          const { onDidSave } =
            textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
          const updatedNote = await onDidSave(editor.document);

          expect(updatedNote?.body).toEqual(testNoteProps.body + textToAppend);
          expect(engine.notes["foo"].body).toEqual(
            testNoteProps.body + textToAppend
          );
        });
      }
    );

    describeSingleWS(
      "WHEN the contents of the note has changed",
      {
        postSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN update engine events should be fired", (done) => {
          textDocumentService = new TextDocumentService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument
          );
          const engine = ExtensionProvider.getEngine();
          const testNoteProps = engine.notes["foo"];
          const textToAppend = "new text here";

          const disposable = subscribeToEngineStateChange(
            (noteChangeEntries: NoteChangeEntry[]) => {
              const createEntries = extractNoteChangeEntriesByType(
                noteChangeEntries,
                "create"
              );

              const deleteEntries = extractNoteChangeEntriesByType(
                noteChangeEntries,
                "delete"
              );

              const updateEntries = extractNoteChangeEntriesByType(
                noteChangeEntries,
                "update"
              ) as NoteChangeUpdateEntry[];

              testAssertsInsideCallback(() => {
                expect(createEntries.length).toEqual(0);
                expect(updateEntries.length).toEqual(1);
                expect(deleteEntries.length).toEqual(0);

                const updateEntry = updateEntries[0];

                expect(updateEntry.note.fname).toEqual("foo");
                expect(updateEntry.note.body).toEqual(
                  testNoteProps.body + textToAppend
                );
                disposable.dispose();
              }, done);
            }
          );

          ExtensionProvider.getWSUtils()
            .openNote(testNoteProps)
            .then((editor) => {
              editor.edit((editBuilder) => {
                const line = editor.document.getText().split("\n").length;
                editBuilder.insert(new vscode.Position(line, 0), textToAppend);
              });
              editor.document.save();
            });
        });
      }
    );

    describeMultiWS(
      "WHEN the contents of the note has not changed",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN onDidSave should return original note and engine note contents should be untouched", async () => {
          textDocumentService = new TextDocumentService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument
          );
          const engine = ExtensionProvider.getEngine();
          const testNoteProps = engine.notes["foo"];
          const editor = await ExtensionProvider.getWSUtils().openNote(
            testNoteProps
          );

          const { onDidSave } =
            textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
          const updatedNote = await onDidSave(editor.document);

          expect(updatedNote).toBeTruthy();
          expect(updatedNote).toEqual(testNoteProps);
          expect(engine.notes["foo"].body).toEqual(testNoteProps.body);
        });
      }
    );

    describeSingleWS(
      "WHEN the contents don't match any note",
      {
        postSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN onDidSave should return undefined and engine note contents should be untouched", async () => {
          textDocumentService = new TextDocumentService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument
          );
          const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const testNoteProps = await NoteTestUtilsV4.createNote({
            fname: "blahblah123",
            body: `[[beta]]`,
            vault: vaults[0],
            wsRoot,
          });
          const editor = await ExtensionProvider.getWSUtils().openNote(
            testNoteProps
          );

          expect(engine.notes["blahblah123"]).toBeFalsy();
          const { onDidSave } =
            textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
          const updatedNote = await onDidSave(editor.document);

          expect(updatedNote).toBeFalsy();
        });
      }
    );
  });
});
