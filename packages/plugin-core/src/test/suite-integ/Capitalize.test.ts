import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { CapitalizeCommand } from "../../commands/Capitalize";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("Capitalize", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);

  test("error: nothing selected", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async () => {
        const cmd = new CapitalizeCommand();

        const { error } = await cmd.execute();

        expect(error!.message).toEqual("nothing selected");
        done();
      },
    });
  });

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const note = engine.notes["foo"];
        const editor = await VSCodeUtils.openNote(note);
        editor.selection = new vscode.Selection(7, 0, 7, 8);

        // run cmd
        const result = await new CapitalizeCommand().run();

        expect(result).toEqual({ capitalized: "FOO BODY" });
        done();
      },
    });
  });
});
