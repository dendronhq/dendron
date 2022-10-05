import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { GoUpCommand } from "../../commands/GoUpCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("GoUpCommand", function () {
  const ctx = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const note = (await engine.getNoteMeta("foo")).data!;
        await WSUtils.openNote(note);
        await new GoUpCommand(ExtensionProvider.getExtension()).run();
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "root.md"
          )
        ).toBeTruthy();
        done();
      },
    });
  });

  test("go up with stub", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const note = (await engine.getNoteMeta("foo.ch1")).data!;
        await WSUtils.openNote(note);
        await new GoUpCommand(ExtensionProvider.getExtension()).run();
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.md"
          )
        ).toBeTruthy();
        done();
      },
    });
  });
});
