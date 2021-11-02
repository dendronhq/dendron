// @ts-nocheck

import { NoteUtils, WorkspaceOpts } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { WorkspaceWatcher } from "../../WorkspaceWatcher";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  runSuiteButSkipForWindows,
  setupBeforeAfter,
} from "../testUtilsV3";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { getDWorkspace } from "../../workspace";
import { VSCodeUtils } from "../../utils";
import { Position } from "vscode";
import { SchemaSyncService } from "../../services/SchemaSyncService";
import * as _ from "lodash";

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

          const opened = await VSCodeUtils.openSchema(engine.schemas.daily);

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
          await SchemaSyncService.instance().onDidSave({
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
          watcher = new WorkspaceWatcher();
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
          watcher = new WorkspaceWatcher();
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
});
