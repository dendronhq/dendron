import { NoteUtils } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { FileWatcher } from "../../fileWatcher";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("FileWatcher", function () {
  let ctx: vscode.ExtensionContext;
  let watcher: FileWatcher;

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

    test("onDidChange: change", function (done) {
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
          watcher = new FileWatcher({
            wsRoot,
            vaults,
          });
          const uri = editor.document.uri;
          const resp = await watcher.onDidChange(uri);
          expect(resp?.contentHash).toEqual("465a4f4ebf83fbea836eb7b8e8e040ec");
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

    test("onDidChange: no change", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ vaults, wsRoot, engine }) => {
          const foo = engine.notes["foo"];
          const editor = await VSCodeUtils.openNote(foo);
          watcher = new FileWatcher({
            wsRoot,
            vaults,
          });
          const uri = editor.document.uri;
          const resp = await watcher.onDidChange(uri);
          expect(_.isUndefined(resp)).toBeTruthy();
          done();
        },
      });
    });
  });
});
