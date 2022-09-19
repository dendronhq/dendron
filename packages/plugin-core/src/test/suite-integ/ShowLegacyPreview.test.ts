import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { test } from "mocha";
import sinon from "sinon";
import { ExtensionContext } from "vscode";
import { ShowLegacyPreviewCommand } from "../../commands/ShowLegacyPreview";
import { MarkdownUtils } from "../../utils/md";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("ShowLegacyPreview", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this);

  test("ok: show legacy preview when installed ", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const note = (await engine.getNoteMeta("foo")).data!;
        await WSUtils.openNote(note);
        sinon.stub(MarkdownUtils, "hasLegacyPreview").returns(true);
        const showLegacyPreview = sinon.stub(
          MarkdownUtils,
          "showLegacyPreview"
        );
        await new ShowLegacyPreviewCommand().execute();
        expect(showLegacyPreview.called).toBeTruthy();
        done();
      },
    });
  });
});
