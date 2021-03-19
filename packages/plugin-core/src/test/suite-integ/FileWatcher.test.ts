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

suite("notes", function () {
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
        onInit: async ({ vaults, wsRoot }) => {
          const bar = await NoteTestUtilsV4.createNote({
            fname: "bar",
            body: "bar body",
            vault: vaults[0],
            wsRoot,
          });
          watcher = new VaultWatcher({
            wsRoot,
            vaults,
          });

          const notePath = path.join(wsRoot, vaults[0].fsPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          const note = await watcher.onDidCreate(uri);
          expect(note!.id).toEqual(bar.id);
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
