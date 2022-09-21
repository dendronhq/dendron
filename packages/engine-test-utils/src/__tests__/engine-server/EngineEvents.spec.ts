import {
  NoteChangeEntry,
  NoteChangeUpdateEntry,
  extractNoteChangeEntriesByType,
} from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  testAssertsInsideCallback,
} from "@dendronhq/common-test-utils";
import { DendronEngineClient } from "@dendronhq/engine-server";
import { createEngineFromServer, ENGINE_HOOKS, runEngineTestV5 } from "../..";

/**
 * Tests that the EngineEvents interface of the client-side DendronEngineClient signals properly
 */
describe("GIVEN a DendronEngineClient running on client-side", () => {
  describe("WHEN writing a new note", () => {
    test("THEN create event fired with the correct props AND update note event fired for its parent", (done) => {
      runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          // TODO: Get rid of this casting once the proper way to expose EngineEvents of DendronEngineClient is implemented
          const engineClient = engine as DendronEngineClient;

          const newNote = await NoteTestUtilsV4.createNote({
            fname: "alpha",
            body: `[[beta]]`,
            vault: vaults[0],
            wsRoot,
          });

          engineClient.onEngineNoteStateChanged(
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
                expect(createEntries.length).toEqual(1);
                expect(updateEntries.length).toEqual(1);
                expect(deleteEntries.length).toEqual(0);

                const updateEntry = updateEntries[0];

                // The root should have been updated to reflect the additional alpha child note:
                expect(updateEntry.note.fname).toEqual("root");
                expect(updateEntry.prevNote.children.length).toEqual(2);
                expect(updateEntry.note.children.length).toEqual(3);
                expect(
                  updateEntry.note.children.find((name) => name === "alpha")
                ).toBeTruthy();

                expect(createEntries[0].note.fname).toEqual("alpha");
              }, done);
            }
          );

          await engineClient.writeNote(newNote);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN writing a new note as a grandchild, whose parent doesn't exist yet", () => {
    test("THEN create event fired for both child and parent (with stub), and update note fired for grandparent", (done) => {
      runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const engineClient = engine as DendronEngineClient;

          const newNote = await NoteTestUtilsV4.createNote({
            fname: "bar.child.grandchild",
            vault: vaults[0],
            wsRoot,
          });

          engineClient.onEngineNoteStateChanged(
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
                expect(createEntries.length).toEqual(2);
                expect(updateEntries.length).toEqual(1);
                expect(deleteEntries.length).toEqual(0);

                const updateEntry = updateEntries[0];
                expect(updateEntry.note.fname).toEqual("bar");
                expect(updateEntry.prevNote.children.length).toEqual(0);
                expect(updateEntry.note.children.length).toEqual(1);

                createEntries.forEach((entry) => {
                  if (entry.note.fname === "bar.child") {
                    expect(entry.note.stub).toBeTruthy();
                  } else if (entry.note.fname === "bar.child.grandchild") {
                    expect(entry.note.stub).toBeFalsy();
                  } else {
                    done({
                      message: `Unexpected note created with id: ${entry.note.fname}`,
                    });
                  }
                });
              }, done);
            }
          );

          await engineClient.writeNote(newNote);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN writing over an existing note by changing its ID", () => {
    test("THEN expect all dependent notes to be updated", (done) => {
      runEngineTestV5(
        async ({ engine }) => {
          const engineClient = engine as DendronEngineClient;

          const fooUpdated = { ...(await engine.getNote("foo")).data! };
          fooUpdated.id = "updatedID";

          engineClient.onEngineNoteStateChanged(
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
                expect(createEntries.length).toEqual(1);
                expect(updateEntries.length).toEqual(2);
                expect(deleteEntries.length).toEqual(1);

                expect(createEntries[0].note.fname).toEqual("foo");
                expect(createEntries[0].note.id).toEqual("updatedID");
                expect(createEntries[0].note.children).toEqual(["foo.ch1"]);
                expect(createEntries[0].note.parent).toBeTruthy();
                const note = (
                  await engine.getNote(createEntries[0].note.parent!)
                ).data!;
                expect(note.fname).toEqual("root");
                expect(deleteEntries[0].note.fname).toEqual("foo");
                expect(deleteEntries[0].note.id).toEqual("foo");

                updateEntries.forEach((entry) => {
                  if (entry.note.fname === "root") {
                    expect(entry.note.children).toEqual(["bar", "updatedID"]);
                    expect(entry.status).toEqual("update");
                  } else if (entry.note.fname === "foo.ch1") {
                    expect(entry.note.parent).toEqual("updatedID");
                    expect(entry.status).toEqual("update");
                  } else {
                    done({
                      message: `Unexpected NoteChangeEntry. fname: ${entry.note.fname}, id: ${entry.note.id}, status: ${entry.status}`,
                    });
                    return;
                  }
                });
              }, done);
            }
          );

          await engineClient.writeNote(fooUpdated);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN calling bulkWriteNotes", () => {
    test("THEN onNoteCreate event fires for each added note", (done) => {
      runEngineTestV5(
        async ({ engine, vaults, wsRoot }) => {
          const engineClient = engine as DendronEngineClient;

          let alphaCreateCallbackReceived = false;
          let betaCreateCallbackReceived = false;

          const alpha = await NoteTestUtilsV4.createNote({
            fname: "alpha",
            vault: vaults[0],
            wsRoot,
          });

          const beta = await NoteTestUtilsV4.createNote({
            fname: "beta",
            vault: vaults[0],
            wsRoot,
          });

          engineClient.onEngineNoteStateChanged(
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
                // 2 create entries for 2 new notes. 2 update entries for updated root
                expect(createEntries.length).toEqual(2);
                expect(updateEntries.length).toEqual(2);
                expect(deleteEntries.length).toEqual(0);

                createEntries.forEach((entry) => {
                  if (entry.note.fname === "alpha") {
                    alphaCreateCallbackReceived = true;
                  } else if (entry.note.fname === "beta") {
                    betaCreateCallbackReceived = true;
                  } else {
                    done({
                      message: `NoteChangeEntry with unexpected fname: ${entry.note.fname}`,
                    });
                    return;
                  }
                });

                if (alphaCreateCallbackReceived && betaCreateCallbackReceived) {
                  // correct entry received
                  return;
                } else {
                  done({
                    message: `Did not receive updates for both alpha and beta note updates.`,
                  });
                }
              }, done);
            }
          );

          await engineClient.bulkWriteNotes({
            notes: [alpha, beta],
          });
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN updating a note (no links)", () => {
    test("THEN update event fired with the updated title", (done) => {
      runEngineTestV5(
        async ({ engine, vaults }) => {
          const engineClient = engine as DendronEngineClient;
          const rootFile = (
            await engine.findNotes({ fname: "root", vault: vaults[0] })
          )[0];
          rootFile!.title = "updated";

          engineClient.onEngineNoteStateChanged(
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

                const updatedEntry = updateEntries[0];

                expect(updatedEntry.status).toEqual("update");
                expect(updatedEntry.note.title).toEqual("updated");
                expect(updatedEntry.prevNote.title).toEqual("Root");
              }, done);
            }
          );

          await engineClient.writeNote(rootFile!, { metaOnly: true });
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN deleting a note that has children", () => {
    test("THEN *update* (not delete) event fired with stub === true", (done) => {
      runEngineTestV5(
        async ({ engine }) => {
          const engineClient = engine as DendronEngineClient;

          // foo has one child in the ENGINE_HOOKS.setupBasic setup
          const foo = (await engine.getNote("foo")).data!;

          engineClient.onEngineNoteStateChanged(
            (noteChangeEntries: NoteChangeEntry[]) => {
              // foo stub is created
              const createEntries = extractNoteChangeEntriesByType(
                noteChangeEntries,
                "create"
              );

              // original foo is created
              const deleteEntries = extractNoteChangeEntriesByType(
                noteChangeEntries,
                "delete"
              );

              // foo's parent is updated, foo's child is updated
              const updateEntries = extractNoteChangeEntriesByType(
                noteChangeEntries,
                "update"
              ) as NoteChangeUpdateEntry[];

              testAssertsInsideCallback(() => {
                expect(createEntries.length).toEqual(1);
                expect(updateEntries.length).toEqual(2);
                expect(deleteEntries.length).toEqual(1);

                const updatedEntry = updateEntries[0];

                expect(updatedEntry.status).toEqual("update");
                expect(updatedEntry.note.fname).toEqual("root");
                expect(updatedEntry.note.children.length).toEqual(2);

                expect(updateEntries[1].status).toEqual("update");
                expect(updateEntries[1].note.fname).toEqual("foo.ch1");
                expect(updateEntries[1].note.parent).toEqual(
                  createEntries[0].note.id
                );

                expect(deleteEntries[0].note.fname).toEqual("foo");
                expect(createEntries[0].note.fname).toEqual("foo");
                expect(createEntries[0].note.stub).toBeTruthy();
              }, done);
            }
          );

          await engineClient.deleteNote(foo.id);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN deleting a note that has no children", () => {
    test("THEN delete event fired with the correct note props AND update event fired for its parent", (done) => {
      runEngineTestV5(
        async ({ engine }) => {
          const engineClient = engine as DendronEngineClient;

          // bar has no children in the ENGINE_HOOKS_MULTI.setupBasicMulti setup.
          const bar = (await engine.getNote("bar")).data!;

          engineClient.onEngineNoteStateChanged(
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
                expect(deleteEntries.length).toEqual(1);

                expect(deleteEntries[0].note.fname).toEqual(bar.fname);

                const updateEntry = updateEntries[0];

                expect(updateEntry.note.fname).toEqual("root");
                expect(updateEntry.note.children.length).toEqual(1);
                expect(updateEntry.prevNote.children.length).toEqual(2);
              }, done);
            }
          );

          await engineClient.deleteNote(bar.id);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  /**
   * If test fails due to timeout, then it means at least one of the expected
   * onNoteCreated/onNoteDeleted callbacks was not received.
   *
   * Current storeV2 behavior is to delete and then create a note during a
   * rename (because the file system name has been changed).
   *
   * TODO: in this test case, an update is reported on the Root node, even
   * though prev/new states are identical. This bug should be fixed.
   */
  describe("WHEN renaming an existing note", () => {
    test("THEN create AND delete events both get fired with the correct props", (done) => {
      runEngineTestV5(
        async ({ engine, vaults }) => {
          const engineClient = engine as DendronEngineClient;
          const bar = (await engine.getNote("bar")).data!;

          engineClient.onEngineNoteStateChanged(
            (noteChangeEntries: NoteChangeEntry[]) => {
              const createEntries = extractNoteChangeEntriesByType(
                noteChangeEntries,
                "create"
              );

              const deleteEntries = extractNoteChangeEntriesByType(
                noteChangeEntries,
                "delete"
              );

              testAssertsInsideCallback(() => {
                expect(createEntries.length).toEqual(1);
                // See TODO in test description:
                // expect(updateEntries.length).toEqual(0);
                expect(deleteEntries.length).toEqual(1);

                expect(createEntries[0].note.fname).toEqual("cab");
                expect(deleteEntries[0].note.fname).toEqual("bar");
              }, done);
            }
          );

          await engineClient.renameNote({
            oldLoc: { fname: bar.fname, vaultName: vaults[0].fsPath },
            newLoc: { fname: "cab", vaultName: vaults[0].fsPath },
          });
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });
});

// TODO: Cover more scenarios - some of these likely have product bugs (like link update events properly signalling):
// WHEN calling update on a note that doesn't exist yet
// WHEN calling create on a note that already exists
// WHEN updating a note with a new link
// WHEN updating a note to remove a link
// WHEN deleting a note that contains links
// WHEN deleting a note that has back references
