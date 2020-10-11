import { DirResult, FileTestUtils } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import { afterEach, beforeEach } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { GoUpCommand } from "../../commands/GoUpCommand";
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
      await new GoUpCommand().run();
      assert.ok(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
          "root.md"
        )
      );
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

  test("go up with stub", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.ch1.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      await new GoUpCommand().run();
      assert.ok(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
          "root.md"
        )
      );
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        fs.removeSync(path.join(vaultPath, "foo.md"));
      },
    });
  });
});
