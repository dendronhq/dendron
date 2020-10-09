import { DirResult, FileTestUtils } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { DeleteNodeCommand } from "../../commands/DeleteNodeCommand";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      await new DeleteNodeCommand().execute();
      const vaultFiles = fs.readdirSync(vaultPath);
      const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".md"));
      assert.strictEqual(noteFiles.length, 2);
      assert.deepStrictEqual(noteFiles.sort(), ["foo.ch1.md", "root.md"]);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteoneSchemaPreset({ vaultDir });
      },
    });
  });
});

suite("schemas", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.schema.yml");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      await new DeleteNodeCommand().execute();
      const vaultFiles = fs.readdirSync(vaultPath);
      const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".schema.yml"));
      assert.strictEqual(noteFiles.length, 1);
      assert.deepStrictEqual(noteFiles.sort(), ["root.schema.yml"]);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteoneSchemaPreset({ vaultDir });
      },
    });
  });
});
