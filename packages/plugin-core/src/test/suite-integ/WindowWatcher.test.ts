import { NoteUtilsV2 } from "@dendronhq/common-all";
import { DirResult, tmpDir, note2File } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { WindowWatcher } from "../../windowWatcher";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  this.timeout(TIMEOUT);
  let watcher: WindowWatcher;

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  describe("onDidChange", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        watcher = new WindowWatcher();
        const notePath = path.join(vaultPath, "bar.md");
        const uri = vscode.Uri.file(notePath);
        await VSCodeUtils.openFileInEditor(uri);
        await watcher.triggerUpdateDecorations();
        // TODO: check for decorations
        done();
        //const note = (await watcher.onDidChange(uri)) as NotePropsV2;
        // const contentMod = fs.readFileSync(uri.fsPath, { encoding: "utf8" });
        // assert.ok(contentMod.indexOf(note.updated) >= 0);
        // done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir) => {
          vaultPath = vaultDir;
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
          const bar = NoteUtilsV2.create({
            fname: `bar`,
            id: `bar`,
            body: "bar body",
            updated: "1",
            created: "1",
          });
          await note2File(bar, vaultPath);
        },
      });
    });
  });
});
