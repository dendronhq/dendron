import { NoteUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { FileWatcher } from "../../fileWatcher";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("FileWatcher", function () {
  let ctx: vscode.ExtensionContext;
  let watcher: FileWatcher;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("onDidCreate", () => {
    test("onDidCreate", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ vaults, wsRoot, engine }) => {
          await NoteTestUtilsV4.createNote({
            fname: "newbar",
            body: "newbar body",
            vault: vaults[0],
            wsRoot,
          });
          watcher = new FileWatcher({
            wsRoot,
            vaults,
          });

          const notePath = path.join(wsRoot, vaults[0].fsPath, "newbar.md");
          const uri = vscode.Uri.file(notePath);
          await watcher.onDidCreate(uri);
          const note = engine.notes["newbar"];
          const root = NoteUtils.getNoteOrThrow({
            fname: "root",
            vault: vaults[0],
            wsRoot,
            notes: engine.notes,
          });
          expect(note.parent).toEqual(root.id);
          done();
        },
      });
    });
  });
});
