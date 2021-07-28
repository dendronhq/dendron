import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { test } from "mocha";
import { ExtensionContext } from "vscode";
import { CapitalizeCommand } from "../../commands/CapitalizeCommand";
import { VSCodeUtils } from "../../utils";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import * as vscode from "vscode";

suite("CapitalizeCommand", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this);

	test("capitalize test", (done) => {

		runLegacyMultiWorkspaceTest({
			ctx,
			preSetupHook: ENGINE_HOOKS.setupBasic,
			onInit: async ({ engine }) => {
				const note = engine.notes["foo"];
				const editor = await VSCodeUtils.openNote(note);
				editor.selection = new vscode.Selection(7, 0, 8, 0);

				const expectedText = "Foo Body";
				
				await new CapitalizeCommand().execute();
				
				const actualText = editor.document.getText(editor.selection);

				expect(expectedText).toEqual(actualText);
				done();
			},
		});

	});
	
});
