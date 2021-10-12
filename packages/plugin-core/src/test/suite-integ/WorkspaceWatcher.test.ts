import { NoteUtils, WorkspaceOpts } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { WorkspaceWatcher } from "../../WorkspaceWatcher";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

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
