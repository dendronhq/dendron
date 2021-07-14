import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { CapitalizeCommand } from "../../commands/Capitalize";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("Capitalize", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const note = engine.notes["foo"];
        const editor = await VSCodeUtils.openNote(note);
        editor.selection = new vscode.Selection(8, 0, 8, 8);

        // run cmd
        const capitalizedText = await new CapitalizeCommand().run();

        expect(capitalizedText).toEqual("FOO BODY");
        done();
      },
    });
  });
});
