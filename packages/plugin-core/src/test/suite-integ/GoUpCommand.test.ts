import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { GoUpCommand } from "../../commands/GoUpCommand";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("GoUpCommand", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const note = engine.notes["foo"];
        await VSCodeUtils.openNote(note);
        await new GoUpCommand().run();
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
        const note = engine.notes["foo.ch1"];
        await VSCodeUtils.openNote(note);
        await new GoUpCommand().run();
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
