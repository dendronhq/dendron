import { DendronWebViewKey } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { test } from "mocha";
import { ExtensionContext } from "vscode";
import { CapitalizeCommand } from "../../commands/CapitalizeCommand";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";


suite("CapitalizeCommand", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this);

	test("ok: capitalize tests", (done) => {

		runLegacyMultiWorkspaceTest({
			ctx,
			preSetupHook: ENGINE_HOOKS.setupBasic,
			onInit: async ({ engine }) => {
				const note = engine.notes["foo"];
				await VSCodeUtils.openNote(note)
				await new CapitalizeCommand().execute();
				const preview = DendronWorkspace.instance().getWebView(DendronWebViewKey.NOTE_PREVIEW);
				expect(preview?.visible).toBeTruthy();
				done();
			},
		});

	});
	
});
