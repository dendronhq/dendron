import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { GoDownCommand } from "../../commands/GoDownCommand";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const note = (await engine.getNoteMeta("foo")).data!;
        await WSUtils.openNote(note);
        await new GoDownCommand().run({ noConfirm: true });
        const editor = VSCodeUtils.getActiveTextEditor();
        const activeNote = await WSUtils.getNoteFromDocument(editor!.document);
        expect(activeNote?.fname).toEqual("foo.ch1");

        done();
      },
    });
  });
});
