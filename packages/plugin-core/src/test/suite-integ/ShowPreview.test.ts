import { DendronWebViewKey } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { test } from "mocha";
import sinon from "sinon";
import { ExtensionContext } from "vscode";
import { ShowPreviewCommand } from "../../commands/ShowPreview";
import { VSCodeUtils } from "../../utils";
import { MarkdownUtils } from "../../utils/md";
import { DendronWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter, withConfig } from "../testUtilsV3";


suite("ShowPreview", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this);

	test("ok: show previewv2 by default", (done) => {

		runLegacyMultiWorkspaceTest({
			ctx,
			preSetupHook: ENGINE_HOOKS.setupBasic,
			onInit: async ({ engine }) => {
				const note = engine.notes["foo"];
				await VSCodeUtils.openNote(note)
				await new ShowPreviewCommand().execute();
				const preview = DendronWorkspace.instance().getWebView(DendronWebViewKey.NOTE_PREVIEW);
				expect(preview?.visible).toBeTruthy();
				done();
			},
		});

	});

	test("ok: prompt install for legacy preview when missing", (done) => {

		runLegacyMultiWorkspaceTest({
			ctx,
			preSetupHook: ENGINE_HOOKS.setupBasic,
			onInit: async ({ engine, wsRoot }) => {
				withConfig(
					(config) => {
						config.dev = {
							enablePreviewV2: false
						}
						return config;
					},
					{ wsRoot }
				);
				const note = engine.notes["foo"];
				await VSCodeUtils.openNote(note)
				const stub = sinon.stub(MarkdownUtils, "hasLegacyPreview").returns(false)
				// @ts-ignore
				const installPrompt = sinon.stub(MarkdownUtils, "promptInstallLegacyPreview").returns(()=>{})
				try {
					await new ShowPreviewCommand().execute();
					expect(installPrompt.called).toBeTruthy();
				}
				finally {
					stub.restore();
					installPrompt.restore();
					done();
				}
			},
		});
	});

	test("ok: show legacy preview when installed ", (done) => {

		runLegacyMultiWorkspaceTest({
			ctx,
			preSetupHook: ENGINE_HOOKS.setupBasic,
			onInit: async ({ engine, wsRoot }) => {
				withConfig(
					(config) => {
						config.dev = {
							enablePreviewV2: false
						}
						return config;
					},
					{ wsRoot }
				);
				const note = engine.notes["foo"];
				await VSCodeUtils.openNote(note)
				const stub = sinon.stub(MarkdownUtils, "hasLegacyPreview").returns(true)
				const showLegacyPreview = sinon.stub(MarkdownUtils, "showLegacyPreview");
				try {
					await new ShowPreviewCommand().execute();
					expect(showLegacyPreview.called).toBeTruthy();
				}
				finally {
					stub.restore();
					showLegacyPreview.restore();
					done();
				}
			},
		});
	});
});
