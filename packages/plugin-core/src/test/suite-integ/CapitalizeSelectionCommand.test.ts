import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import path from "path";
import * as vscode from "vscode";
import { CapitalizeSelectionCommand } from "../../commands/CapitalizeSelectionCommand";
import { VSCodeUtils } from "../../utils";
import { expect, runMultiVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("CapitalizeSelectionCommand", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });
  test("basic", (done) => {
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "gamma",
          body: "hello world",
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const notePath = path.join(wsRoot, vaults[0].fsPath, "gamma.md");
        const editor = (await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(notePath)
        ))!;

        const SIMPLE_SELECTION = new vscode.Selection(7, 0, 7, 11);
        editor.selection = SIMPLE_SELECTION;

        await new CapitalizeSelectionCommand().execute();

        expect(editor.document.getText(SIMPLE_SELECTION)).toEqual(
          "Hello World"
        );

        done();
      },
    });
  });
});
