import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import * as vscode from "vscode";
import { EngineAPIService } from "../../services/EngineAPIService";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

/**
 * Tests that the EngineEvents interface of EngineAPIService signals properly
 */
suite("Engine API Service Events Test", function testSuite() {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  // Set test timeout to 2 seconds
  this.timeout(2000);

  describe(`WHEN updating a note`, function () {
    test("THEN onNoteChange event fired with the updated title and existing properties unchanged", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine }) => {
          // TODO: Get rid of this casting once the proper way to expose EngineAPIService is implemented
          const engineAPIService = engine as EngineAPIService;
          const foo = engine.notes["foo"];
          foo.title = "updated";

          engineAPIService.onNoteChange((noteProps) => {
            try {
              expect(noteProps.title).toEqual("updated");
              expect(noteProps.fname).toEqual("foo");
              done();
            } catch (err) {
              done(err);
            }
          });

          engineAPIService.updateNote(foo);
        },
      });
    });
  });

  describe(`WHEN writing a new note`, function () {
    test("THEN onNoteCreate event fired with the correct props", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine, vaults, wsRoot }) => {
          const engineAPIService = engine as EngineAPIService;

          const newNote = await NoteTestUtilsV4.createNote({
            fname: "alpha",
            body: `[[beta]]`,
            vault: vaults[0],
            wsRoot,
          });

          engineAPIService.onNoteCreated((noteProps) => {
            try {
              expect(noteProps.fname).toEqual(newNote.fname);
              expect(noteProps.title).toEqual(newNote.title);
              done();
            } catch (err) {
              done(err);
            }
          });

          engineAPIService.writeNote(newNote);
        },
      });
    });
  });

  /**
   * If we try to delete a note that has children, the node remains but becomes stub === true.
   */
  describe(`WHEN deleting a note that has children`, function () {
    test("THEN onUpdateNote event fired with stub === true", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine }) => {
          const engineAPIService = engine as EngineAPIService;

          // foo has one child in the ENGINE_HOOKS_MULTI.setupBasicMulti setup.
          const foo = engine.notes["foo"];

          engineAPIService.onNoteChange((noteProps) => {
            try {
              expect(noteProps.fname).toEqual("foo");
              expect(noteProps.stub).toBeTruthy();
              done();
            } catch (err) {
              done(err);
            }
          });
          engineAPIService.deleteNote(foo.id);
        },
      });
    });
  });

  /**
   * If we try to delete a note that has no children, the node remains but becomes stub === true.
   */
  describe(`WHEN deleting a note that has nochildren`, function () {
    test("THEN onDeleteNote event fired with the correct note props", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine }) => {
          const engineAPIService = engine as EngineAPIService;

          // bar has no children in the ENGINE_HOOKS_MULTI.setupBasicMulti setup.
          const bar = engine.notes["bar"];

          engineAPIService.onNoteDeleted((noteProps) => {
            try {
              expect(noteProps.fname).toEqual(bar.fname);
              done();
            } catch (err) {
              done(err);
            }
          });
          engineAPIService.deleteNote(bar.id);
        },
      });
    });
  });

  /**
   * If test fails due to timeout, then it means at least one of the expected
   * onNoteCreated/onNoteDeleted callbacks was not received.
   */
  describe(`WHEN renaming an existing note`, function () {
    test("THEN onNoteCreated AND onNoteDeleted events both get fired with the correct props", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine, vaults }) => {
          const engineAPIService = engine as EngineAPIService;
          const bar = engine.notes["bar"];

          let onNoteDeletedCallbackReceived = false;
          let onNoteCreatedCallbackReceived = false;

          engineAPIService.onNoteCreated((noteProps) => {
            if (noteProps.fname === "cab") {
              onNoteCreatedCallbackReceived = true;
            } else {
              done({
                message: `onNoteCreated invoked with unexpected NoteProps. Fname: ${noteProps.fname}`,
              } as Error);
            }

            if (
              onNoteCreatedCallbackReceived &&
              onNoteDeletedCallbackReceived
            ) {
              done();
            }
          });

          engineAPIService.onNoteDeleted((noteProps) => {
            if (noteProps.fname === bar.fname) {
              onNoteDeletedCallbackReceived = true;
            } else {
              done({
                message: `onNoteDeleted invoked with unexpected NoteProps. Fname: ${noteProps.fname}`,
              } as Error);
            }

            if (
              onNoteCreatedCallbackReceived &&
              onNoteDeletedCallbackReceived
            ) {
              done();
            }
          });

          engineAPIService.renameNote({
            oldLoc: { fname: bar.fname, vaultName: vaults[1].fsPath },
            newLoc: { fname: "cab", vaultName: vaults[1].fsPath },
          });
        },
      });
    });
  });

  /**
   * If test fails due to timeout, then it means at least one of the expected
   * onNoteCreated callbacks was not received.
   */
  describe(`WHEN calling bulkAddNotes`, function () {
    test("THEN onNoteCreate event fires for each added note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine, vaults, wsRoot }) => {
          const engineAPIService = engine as EngineAPIService;

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

          engineAPIService.onNoteCreated((noteProps) => {
            if (noteProps.fname === "alpha") {
              alphaCreateCallbackReceived = true;
            } else if (noteProps.fname === "beta") {
              betaCreateCallbackReceived = true;
            } else {
              done({
                message: `Unexpected invocation of onNoteCreated with fname: ${noteProps.fname}`,
              } as Error);
            }

            if (alphaCreateCallbackReceived && betaCreateCallbackReceived) {
              done();
            }
          });

          engineAPIService.bulkAddNotes({
            notes: [alpha, beta],
          });
        },
      });
    });
  });
});
