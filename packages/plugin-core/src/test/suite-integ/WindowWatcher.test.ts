import { NoteUtilsV2 } from "@dendronhq/common-all";
import { note2File } from "@dendronhq/common-server";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VSCodeUtils } from "../../utils";
import { WindowWatcher } from "../../windowWatcher";
import { runSingleVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
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
          const bar = NoteUtilsV2.create({
            fname: `bar`,
            id: `bar`,
            body: "bar body",
            updated: "1",
            created: "1",
            vault,
          });
          await note2File({ note: bar, vault, wsRoot });
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
