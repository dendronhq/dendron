import { NoteUtilsV2 } from "@dendronhq/common-all";
import { note2File } from "@dendronhq/common-server";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { WindowWatcher } from "../../windowWatcher";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { runSingleVaultTest } from "../testUtilsv2";

suite("notes", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);
  let watcher: WindowWatcher;

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  describe("onDidChange", function () {
    test("basic", function (done) {
      runSingleVaultTest({
        ctx,
        initDirCb: async (vaultPath) => {
          const vault = { fsPath: vaultPath };
          const bar = NoteUtilsV2.create({
            fname: `bar`,
            id: `bar`,
            body: "bar body",
            updated: "1",
            created: "1",
            vault,
          });
          await note2File(bar, vaultPath);
        },
        onInit: async ({ vault }) => {
          const vaultPath = vault.fsPath;
          watcher = new WindowWatcher();
          const notePath = path.join(vaultPath, "bar.md");
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
