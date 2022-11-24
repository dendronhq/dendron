import {
  assert,
  genHash,
  NoteChangeEntry,
  NoteChangeUpdateEntry,
  extractNoteChangeEntriesByType,
  VaultUtils,
  NoteUtils,
  URI,
} from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  testAssertsInsideCallback,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { afterEach, describe } from "mocha";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { TextDocumentService } from "../../services/node/TextDocumentService";
import { ConsoleLogger } from "../../web/utils/ConsoleLogger";
import { expect } from "../testUtilsv2";
import {
  describeSingleWS,
  describeMultiWS,
  subscribeToEngineStateChange,
  waitInMilliseconds,
} from "../testUtilsV3";

async function openAndEdit(fname: string) {
  const engine = ExtensionProvider.getEngine();
  const testNoteProps = (await engine.getNote(fname)).data!;
  const editor = await ExtensionProvider.getWSUtils().openNote(testNoteProps);

  const textToAppend = "new text here";
  editor.edit((editBuilder) => {
    const line = editor.document.getText().split("\n").length;
    editBuilder.insert(new vscode.Position(line, 0), textToAppend);
  });
  await editor.document.save();
  return { editor, engine, note: testNoteProps, textToAppend };
}

async function setupTextDocumentService() {
  const ws = ExtensionProvider.getDWorkspace();
  const { wsRoot, engine } = ws;
  const vaults = await ws.vaults;
  const textDocumentService = new TextDocumentService(
    vscode.workspace.onDidSaveTextDocument,
    URI.file(wsRoot),
    vaults,
    engine,
    new ConsoleLogger()
  );
  const { onDidSave } =
    textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
  return { textDocumentService, onDidSave };
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
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot, engine } = ws;
          const vaults = ExtensionProvider.getDWorkspace().vaults;
          const textToAppend = "new text here";
          vaults.then((vaults) => {
            textDocumentService = new TextDocumentService(
              vscode.workspace.onDidSaveTextDocument,
              URI.file(wsRoot),
              vaults,
              engine,
              new ConsoleLogger()
            );
            const note = NoteUtils.create({
              fname: "alpha",
              vault: vaults[0],
            });
            onDidChangeTextDocumentHandler =
              vscode.workspace.onDidChangeTextDocument(async (event) => {
                if (event.document.isDirty) {
                  const maybeNote =
                    await textDocumentService?.processTextDocumentChangeEvent(
                      event
                    );
                  expect(maybeNote?.body).toEqual(
                    "First Line\n" + textToAppend
                  );
                  // Make sure updated has not changed
                  const alphaNote = (await engine.getNoteMeta("alpha")).data!;
                  expect(maybeNote?.updated).toEqual(alphaNote.updated);
                  done();
                }
              });
            ExtensionProvider.getWSUtils()
              .openNote(note)
              .then((editor) => {
                editor.edit((editBuilder) => {
                  const line = editor.document.getText().split("\n").length;
                  editBuilder.insert(
                    new vscode.Position(line, 0),
                    textToAppend
                  );
                });
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
          const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
          const vaults = ExtensionProvider.getDWorkspace().vaults;
          vaults.then((vaults) => {
            textDocumentService = new TextDocumentService(
              vscode.workspace.onDidSaveTextDocument,
              URI.file(wsRoot),
              vaults,
              engine,
              new ConsoleLogger()
            );
            const foo = NoteUtils.create({
              fname: "foo",
              vault: vaults[0],
            });

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
          const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
          const vaults = ExtensionProvider.getDWorkspace().vaults;
          vaults.then((vaults) => {
            textDocumentService = new TextDocumentService(
              vscode.workspace.onDidSaveTextDocument,
              URI.file(wsRoot),
              vaults,
              engine,
              new ConsoleLogger()
            );
            const currentNote = NoteUtils.create({
              fname: "beta",
              vault: vaults[0],
            });

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
            waitInMilliseconds(10).then(() => done());
          });
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
          const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
          const vaults = ExtensionProvider.getDWorkspace().vaults;
          vaults.then((vaults) => {
            textDocumentService = new TextDocumentService(
              vscode.workspace.onDidSaveTextDocument,
              URI.file(wsRoot),
              vaults,
              engine,
              new ConsoleLogger()
            );
            const note = NoteUtils.create({
              fname: "beta",
              vault: vaults[0],
            });

            onDidChangeTextDocumentHandler =
              vscode.workspace.onDidChangeTextDocument(async (event) => {
                if (event.document.isDirty) {
                  // Set content hash to be same as event to enter content no change logic
                  const currentNote = (await engine.getNote("beta")).data!;
                  currentNote.contentHash = genHash(event.document.getText());
                  await engine.writeNote(currentNote, { metaOnly: true });

                  const maybeNote =
                    await textDocumentService?.processTextDocumentChangeEvent(
                      event
                    );
                  expect(maybeNote).toEqual(currentNote);
                  done();
                }
              });
            ExtensionProvider.getWSUtils()
              .openNote(note)
              .then((editor) => {
                editor.edit((editBuilder) => {
                  const line = editor.document.getText().split("\n").length;
                  editBuilder.insert(new vscode.Position(line, 0), "1");
                });
              });
          });
        });
      }
    );

    describeSingleWS("WHEN the contents don't match any notes", {}, () => {
      test("THEN processTextDocumentChangeEvent should return undefined", (done) => {
        const textToAppend = "new text here";
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = ws.vaults;
        vaults.then((vaults) => {
          textDocumentService = new TextDocumentService(
            vscode.workspace.onDidSaveTextDocument,
            URI.file(wsRoot),
            vaults,
            engine,
            new ConsoleLogger()
          );
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
                  editBuilder.insert(
                    new vscode.Position(line, 0),
                    textToAppend
                  );
                });
              });
          });

          onDidChangeTextDocumentHandler =
            vscode.workspace.onDidChangeTextDocument(async (event) => {
              if (event.document.isDirty) {
                const noteProp = (await engine.getNote("blahblah123")).data;
                expect(noteProp).toBeFalsy();
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
  });

  describe("GIVEN a vscode.workspace.onDidSaveTextDocument event is fired", () => {
    describeSingleWS(
      "WHEN the contents of the note has changed",
      {
        postSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN engine note contents should be updated", async () => {
          const fname = "foo";
          const { onDidSave } = await setupTextDocumentService();
          const { engine, editor, note, textToAppend } = await openAndEdit(
            fname
          );
          const updatedNote = await onDidSave(editor.document);
          expect(updatedNote?.body).toEqual(note.body + textToAppend);
          const noteProp = (await engine.getNote(fname)).data!;
          expect(noteProp.body).toEqual(note.body + textToAppend);
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
          const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
          const vaults = ExtensionProvider.getDWorkspace().vaults;
          vaults.then((vaults) => {
            textDocumentService = new TextDocumentService(
              vscode.workspace.onDidSaveTextDocument,
              URI.file(wsRoot),
              vaults,
              engine,
              new ConsoleLogger()
            );
            const testNoteProps = NoteUtils.create({
              fname: "foo",
              vault: vaults[0],
            });
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

                testAssertsInsideCallback(async () => {
                  expect(createEntries.length).toEqual(0);
                  expect(updateEntries.length).toEqual(1);
                  expect(deleteEntries.length).toEqual(0);

                  const updateEntry = updateEntries[0];

                  expect(updateEntry.note.fname).toEqual("foo");
                  const testNoteProps = (await engine.getNote("foo")).data!;
                  expect(updateEntry.note.body).toEqual(testNoteProps.body);
                  expect(
                    updateEntry.note.body.includes(textToAppend)
                  ).toBeTruthy();
                  disposable.dispose();
                }, done);
              }
            );

            ExtensionProvider.getWSUtils()
              .openNote(testNoteProps)
              .then((editor) => {
                editor.edit((editBuilder) => {
                  const line = editor.document.getText().split("\n").length;
                  editBuilder.insert(
                    new vscode.Position(line, 0),
                    textToAppend
                  );
                });
                editor.document.save();
              });
          });
        });
      }
    );

    describeSingleWS(
      "WHEN the original note contains wikilink and backlink",
      {
        postSetupHook: ENGINE_HOOKS.setupLinks,
      },
      () => {
        test("THEN the wikilink and backlink should remain unchanged", async () => {
          const fname = "alpha";
          const { onDidSave } = await setupTextDocumentService();
          const { engine, editor, note } = await openAndEdit(fname);
          const updatedNote = await onDidSave(editor.document);

          expect(updatedNote?.links).toEqual(note.links);
          const testNote = (await engine.getNoteMeta(fname)).data!;
          expect(testNote.links).toEqual(note.links);
          expect(updatedNote?.links.length).toEqual(2);
          expect(updatedNote?.links[0].value).toEqual("beta");
          expect(updatedNote?.links[0].type).toEqual("wiki");
          expect(updatedNote?.links[0].alias).toEqual(undefined);
          expect(updatedNote?.links[0].position).toEqual({
            end: {
              column: 9,
              line: 1,
              offset: 8,
            },
            indent: [],
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          });
          expect(updatedNote?.links[1].value).toEqual("alpha");
          expect(updatedNote?.links[1].type).toEqual("backlink");
          expect(updatedNote?.links[1].alias).toEqual(undefined);
          expect(updatedNote?.links[1].position).toEqual({
            end: {
              column: 13,
              line: 1,
              offset: 12,
            },
            indent: [],
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          });
        });
      }
    );
    describeSingleWS(
      "WHEN the original note contains only backlink",
      {
        postSetupHook: ENGINE_HOOKS.setupRefs,
      },
      () => {
        test("THEN the backlink should remain unchanged", async () => {
          const fname = "simple-note-ref.one";
          const { onDidSave } = await setupTextDocumentService();
          const { engine, editor, note } = await openAndEdit(fname);
          const updatedNote = await onDidSave(editor.document);

          expect(updatedNote?.links).toEqual(note.links);
          const testNote = (await engine.getNoteMeta(fname)).data!;
          expect(testNote.links).toEqual(note.links);
          expect(updatedNote?.links[0].value).toEqual("simple-note-ref.one");
          expect(updatedNote?.links[0].position).toEqual({
            end: {
              column: 25,
              line: 1,
              offset: 24,
            },
            indent: [],
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          });
        });
      }
    );

    describeSingleWS(
      "WHEN the original note contains frontmatter tag",
      {
        postSetupHook: async (opts) => {
          const vault = opts.vaults[0];
          await ENGINE_HOOKS.setupRefs(opts);
          await NOTE_PRESETS_V4.NOTE_WITH_FM_TAG.create({ ...opts, vault });
        },
      },
      () => {
        test("THEN the fm-tag should remain unchanged", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const fname = "fm-tag";
          const { onDidSave } = await setupTextDocumentService();
          const { engine, editor, note } = await openAndEdit(fname);
          const updatedNote = await onDidSave(editor.document);

          expect(updatedNote?.links).toEqual(note.links);
          const testNote = (await engine.getNoteMeta(fname)).data!;
          expect(testNote.links).toEqual(note.links);
          expect(updatedNote?.links).toEqual([
            {
              alias: "foo",
              from: {
                fname: "fm-tag",
                id: "fm-tag",
                vaultName: VaultUtils.getName(vaults[0]),
              },
              to: {
                fname: "tags.foo",
              },
              type: "frontmatterTag",
              value: "tags.foo",
              xvault: false,
            },
          ]);
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
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot, engine } = ws;
          const vaults = await ws.vaults;
          textDocumentService = new TextDocumentService(
            vscode.workspace.onDidSaveTextDocument,
            URI.file(wsRoot),
            vaults,
            engine,
            new ConsoleLogger()
          );
          const testNoteProps = (await engine.getNote("foo")).data!;
          const editor = await ExtensionProvider.getWSUtils().openNote(
            testNoteProps
          );

          const { onDidSave } =
            textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
          const updatedNote = await onDidSave(editor.document);

          expect(updatedNote).toBeTruthy();
          expect(updatedNote).toEqual(testNoteProps);
          const foo = (await engine.getNote("foo")).data!;
          expect(foo.body).toEqual(testNoteProps.body);
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
          const ws = ExtensionProvider.getDWorkspace();
          const { engine, wsRoot } = ws;
          const vaults = await ws.vaults;
          textDocumentService = new TextDocumentService(
            vscode.workspace.onDidSaveTextDocument,
            URI.file(wsRoot),
            vaults,
            engine,
            new ConsoleLogger()
          );
          const testNoteProps = await NoteTestUtilsV4.createNote({
            fname: "blahblah123",
            body: `[[beta]]`,
            vault: vaults[0],
            wsRoot,
          });
          const editor = await ExtensionProvider.getWSUtils().openNote(
            testNoteProps
          );

          const noteProp = (await engine.getNote("blahblah123")).data;
          expect(noteProp).toBeFalsy();
          const { onDidSave } =
            textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
          const updatedNote = await onDidSave(editor.document);

          expect(updatedNote).toBeFalsy();
        });
      }
    );
  });

  describeSingleWS(
    "Given a note with frontmatter",
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
      test("WHEN the note has frontmatter, THEN getFrontmatterPosition should return true", async () => {
        const engine = ExtensionProvider.getEngine();
        const alphaNote = (await engine.getNoteMeta("alpha")).data!;
        const editor = await ExtensionProvider.getWSUtils().openNote(alphaNote);
        const hasFrontmatter = TextDocumentService.containsFrontmatter(
          editor.document
        );
        expect(hasFrontmatter).toBeTruthy();
      });

      test("WHEN frontmatter is removed, THEN getFrontmatterPosition should return false", async () => {
        const engine = ExtensionProvider.getEngine();
        const alphaNote = (await engine.getNoteMeta("alpha")).data!;

        const editor = await ExtensionProvider.getWSUtils().openNote(alphaNote);
        editor.edit((editBuilder) => {
          editBuilder.delete(
            new vscode.Range(
              new vscode.Position(0, 0),
              new vscode.Position(1, 0)
            )
          );
        });
        await editor.document.save();
        const hasFrontmatter = TextDocumentService.containsFrontmatter(
          editor.document
        );
        expect(hasFrontmatter).toBeFalsy();
      });
    }
  );
});
