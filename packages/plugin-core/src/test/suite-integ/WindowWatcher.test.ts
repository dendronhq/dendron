import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VSCodeUtils } from "../../utils";
import { WindowWatcher } from "../../windowWatcher";
import { runSingleVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("WindowWatcher", function () {
  let ctx: vscode.ExtensionContext;
  let watcher: WindowWatcher;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("onDidChange", function () {
    test("basic", function (done) {
      runSingleVaultTest({
        ctx,
        postSetupHook: async ({ vaults, wsRoot }) => {
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            fname: "bar",
            body: "bar body",
            vault,
            wsRoot,
          });
        },
        onInit: async ({ vault, wsRoot }) => {
          const vaultPath = vault.fsPath;
          watcher = new WindowWatcher();
          const notePath = path.join(wsRoot, vaultPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          await VSCodeUtils.openFileInEditor(uri);
          await watcher.triggerUpdateDecorations();
          // TODO: check for decorations
          done();
        },
      });
    });
  });
});
