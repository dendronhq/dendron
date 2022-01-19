// @ts-nocheck

import {
  NoteProps,
  NoteUtils,
  WorkspaceOpts,
  Wrap,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe, before, beforeEach, afterEach } from "mocha";
import sinon from "sinon";
import path from "path";
import * as vscode from "vscode";
import { WorkspaceWatcher } from "../../WorkspaceWatcher";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  runLegacyMultiWorkspaceTest,
  runSuiteButSkipForWindows,
  setupBeforeAfter,
} from "../testUtilsV3";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { getDWorkspace } from "../../workspace";
import { Position } from "vscode";
import * as _ from "lodash";
import { WSUtils } from "../../WSUtils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";

const setupBasic = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "oldfile",
    body: "oldfile",
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo.one",
    body: `[[oldfile]]`,
  });
};

const doesSchemaExist = (schemaId: string) => {
  const { engine } = getDWorkspace();

  return _.values(engine.schemas).some((schObj) => {
    return !_.isUndefined(schObj.schemas[schemaId]);
  });
};

runSuiteButSkipForWindows()(
  "WorkspaceWatcher schema update tests",
  function () {
    const ctx = setupBeforeAfter(this);

    describeMultiWS(
      "WHEN setup with schema",
      {
        preSetupHook: ENGINE_HOOKS.setupInlineSchema,
        ctx,
      },
      () => {
        test("AND new schema is schema file saved THEN schema is updated in engine.", async () => {
          const { engine } = getDWorkspace();
          const testNote = engine.notes["foo"];
          expect(testNote).toBeTruthy();

          const opened = await WSUtils.openSchema(engine.schemas.plain_schema);

          expect(doesSchemaExist("new_schema")).toBeFalsy();

          await opened.edit((editBuilder) => {
            const line = opened.document.getText().split("\n").length;

            const newElement = [`  - id: new_schema`, `    parent: root`].join(
              "\n"
            );

            editBuilder.insert(new Position(line, 0), newElement);
          });

          // The save should trigger workspace watcher but for some reason within tests
          // its not triggering onDidSaveTextDocument event (although it works within manual testing).
          // So for now we will call the instance of SchemaSyncService to make
          // sure at least that is working as expected.
          expect(await opened.document.save()).toBeTruthy();
          await ExtensionProvider.getExtension().schemaSyncService.onDidSave({
            document: opened.document,
          });

          expect(doesSchemaExist("new_schema")).toBeTruthy();
        });
      }
    );
  }
);

suite("WorkspaceWatcher: GIVEN the dendron extension is running", function () {
  let watcher: WorkspaceWatcher;

  const ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("WHEN user renames a file outside of dendron rename command", () => {
    test("THEN all of its references are also updated", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: setupBasic,
        onInit: async ({ vaults, wsRoot, engine }) => {
          watcher = new WorkspaceWatcher({
            schemaSyncService:
              ExtensionProvider.getExtension().schemaSyncService,
          });
          const oldPath = path.join(wsRoot, vaults[0].fsPath, "oldfile.md");
          const oldUri = vscode.Uri.file(oldPath);
          const newPath = path.join(wsRoot, vaults[0].fsPath, "newfile.md");
          const newUri = vscode.Uri.file(newPath);
          const args: vscode.FileWillRenameEvent = {
            files: [
              {
                oldUri,
                newUri,
              },
            ],
            // eslint-disable-next-line no-undef
            waitUntil: (_args: Thenable<any>) => {
              _args.then(() => {
                const reference = NoteUtils.getNoteOrThrow({
                  fname: "foo.one",
                  vault: vaults[0],
                  wsRoot,
                  notes: engine.notes,
                });
                expect(reference.body).toEqual(`[[newfile]]\n`);
                done();
              });
            },
          };

          watcher.onWillRenameFiles(args);
        },
      });
    });
    test("THEN the title of fileName is also updated", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: setupBasic,
        onInit: async ({ vaults, wsRoot, engine }) => {
          watcher = new WorkspaceWatcher({
            schemaSyncService:
              ExtensionProvider.getExtension().schemaSyncService,
          });
          const oldPath = path.join(wsRoot, vaults[0].fsPath, "oldfile.md");
          const oldUri = vscode.Uri.file(oldPath);
          const newPath = path.join(wsRoot, vaults[0].fsPath, "newfile.md");
          const newUri = vscode.Uri.file(newPath);
          const args: vscode.FileRenameEvent = {
            files: [
              {
                oldUri,
                newUri,
              },
            ],
          };
          const edit = new vscode.WorkspaceEdit();
          edit.renameFile(oldUri, newUri);
          const success = await vscode.workspace.applyEdit(edit);
          if (success) {
            await watcher.onDidRenameFiles(args);
            const newFile = NoteUtils.getNoteOrThrow({
              fname: "newfile",
              vault: vaults[0],
              wsRoot,
              notes: engine.notes,
            });
            expect(newFile.title).toEqual(`Newfile`);
            done();
          }
        },
      });
    });
  });

  describe("GIVEN the user opening a file", () => {
    describeSingleWS(
      "WHEN user opens the file for the first time",
      { ctx },
      () => {
        let note: NoteProps;
        before(async () => {
          const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
          note = await NoteTestUtilsV4.createNoteWithEngine({
            engine,
            fname: "test",
            vault: vaults[0],
            wsRoot,
          });
        });
        test("THEN the cursor moves past the frontmatter", async () => {
          const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
          const stubTimeout = sinon.stub(Wrap, "setTimeout");
          const editor = await WSUtils.openNote(note);
          WorkspaceWatcher.moveCursorPastFrontmatter(editor);
          stubTimeout.callArg(0);
          // the selection should have been moved past the frontmatter
          const { line, character } = editor.selection.active;
          expect(line).toEqual(7);
          expect(character).toEqual(3);
          stubTimeout.restore();
        });
      }
    );

    describeSingleWS(
      "WHEN the user opens the file through the search",
      { ctx },
      () => {
        let note: NoteProps;
        before(async () => {
          const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
          note = await NoteTestUtilsV4.createNoteWithEngine({
            engine,
            fname: "test",
            vault: vaults[0],
            wsRoot,
          });
        });
        test("THEN the cursor moves past the frontmatter", async () => {
          const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
          const stubTimeout = sinon.stub(Wrap, "setTimeout");
          const editor = await WSUtils.openNote(note);
          // pre-move the selection, like what would happen when opening through the serach
          editor.selection = new vscode.Selection(5, 0, 5, 0);
          WorkspaceWatcher.moveCursorPastFrontmatter(editor);
          stubTimeout.callArg(0);
          // the selection didn't move from what it was before
          const { line, character } = editor.selection.active;
          expect(line).toEqual(5);
          expect(character).toEqual(0);
          stubTimeout.restore();
        });
      }
    );
  });
});
