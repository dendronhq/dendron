import { DendronWebViewKey } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { test } from "mocha";
import { ExtensionContext } from "vscode";
import { ShowPreviewCommand } from "../../commands/ShowPreview";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";


suite("ShowPreview", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this);

	test("ok: show previewv2", (done) => {

		runLegacyMultiWorkspaceTest({
			ctx,
			preSetupHook: ENGINE_HOOKS.setupBasic,
			onInit: async ({ engine }) => {
				// withConfig(
				// 	(config) => {
				// 		const randomCfg: RandomNoteConfig = {};
				// 		if (includePattern) randomCfg.include = includePattern;
				// 		if (excludePattern) randomCfg.exclude = excludePattern;
				// 		config.randomNote = randomCfg;
				// 		return config;
				// 	},
				// 	{ wsRoot }
				// );
				const note = engine.notes["foo"];
				await VSCodeUtils.openNote(note)
				await new ShowPreviewCommand().execute();
				const preview = DendronWorkspace.instance().getWebView(DendronWebViewKey.NOTE_PREVIEW);
				expect(preview?.visible).toBeTruthy();
				done();
			},
		});

	});
	
});
