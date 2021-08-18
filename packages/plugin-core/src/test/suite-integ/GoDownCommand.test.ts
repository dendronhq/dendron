import { DirResult, tmpDir } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import path from "path";
import * as vscode from "vscode";
import { GoDownCommand } from "../../commands/GoDownCommand";
// import { DendronQuickPickerV2 } from "../../components/lookup/types";
import { VSCodeUtils } from "../../utils";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { expect } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      await new GoDownCommand().run({noConfirm: true});
      const editor = VSCodeUtils.getActiveTextEditor();
      const activeNote = VSCodeUtils.getNoteFromDocument(editor!.document);
      expect(activeNote?.fname).toEqual("foo.ch1");

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
