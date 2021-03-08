import { DirResult } from "@dendronhq/common-server";
import { FileTestUtils, NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { GoUpCommand } from "../../commands/GoUpCommand";
import { VSCodeUtils } from "../../utils";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { expect } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("GoUpCommand", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = FileTestUtils.tmpDir();
    },
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      await new GoUpCommand().run();
      expect(VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
        "root.md"
      )).toBeTruthy();
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
      expect(VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
        "root.md"
      )).toBeTruthy();
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
