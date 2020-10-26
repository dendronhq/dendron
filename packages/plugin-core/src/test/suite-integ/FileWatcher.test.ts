import { NoteUtilsV2 } from "@dendronhq/common-all";
import { DirResult, FileTestUtils, note2File } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import assert from "assert";
import _ from "lodash";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VaultWatcher } from "../../fileWatcher";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  this.timeout(TIMEOUT);
  let watcher: VaultWatcher;

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });
  describe("onDidCreate", function () {
    test("create", function (done) {
      onWSInit(async () => {
        watcher = new VaultWatcher({
          vaults: [{ name: "main", uri: vscode.Uri.file(vaultPath), index: 0 }],
        });
        const bar = NoteUtilsV2.create({
          fname: `bar`,
          id: `bar`,
          body: "bar body",
          updated: "1",
          created: "1",
        });
        await note2File(bar, vaultPath);
        const notePath = path.join(vaultPath, "bar.md");
        const uri = vscode.Uri.file(notePath);
        const note = await watcher.onDidCreate(uri);
        assert.deepStrictEqual(note?.id, bar.id);
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir) => {
          vaultPath = vaultDir;
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        },
      });
    });

    test.skip("pause ", function (done) {
      onWSInit(async () => {
        // @ts-ignore
        const watcher = new VaultWatcher({
          vaults: [{ name: "main", uri: vscode.Uri.file(vaultPath), index: 0 }],
        });
        watcher.pause = true;
        const bar = NoteUtilsV2.create({
          fname: `bar`,
          id: `bar`,
          body: "bar body",
          updated: "1",
          created: "1",
        });
        await note2File(bar, vaultPath);
        const notePath = path.join(vaultPath, "bar.md");
        const uri = vscode.Uri.file(notePath);
        const note = await watcher.onDidCreate(uri);
        assert.ok(_.isUndefined(note));
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir) => {
          vaultPath = vaultDir;
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        },
      });
    });
  });
});
