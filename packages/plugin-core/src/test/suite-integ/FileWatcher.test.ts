import { NoteUtils } from "@dendronhq/common-all";
import {
  AssertUtils,
  ENGINE_HOOKS_MULTI,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VaultWatcher } from "../../fileWatcher";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("FileWatcher", function () {
  let ctx: vscode.ExtensionContext;
  let watcher: VaultWatcher;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("onDidCreate", function () {
    test("onDidCreate", function (done) {
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
          watcher = new VaultWatcher({
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

    test("onDidChange", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ vaults, wsRoot, engine }) => {
          const foo = engine.notes["foo"];
          const editor = await VSCodeUtils.openNote(foo);
          await editor?.edit((builder) => {
            const pos = new vscode.Position(10, 0);
            const selection = new vscode.Selection(pos, pos);
            builder.replace(selection, `Hello`);
          });
          watcher = new VaultWatcher({
            wsRoot,
            vaults,
          });
          const uri = editor.document.uri;
          await watcher.onDidChange(uri);
          expect(
            await AssertUtils.assertInString({
              body: engine.notes["foo"].body,
              match: ["Hello"],
            })
          ).toBeTruthy();
          done();
        },
      });
    });
  });
});
