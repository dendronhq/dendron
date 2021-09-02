import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { GoDownCommand } from "../../commands/GoDownCommand";
import { VSCodeUtils } from "../../utils";
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
        const note = engine.notes["foo"];
        await VSCodeUtils.openNote(note);
        await new GoDownCommand().run({ noConfirm: true });
        const editor = VSCodeUtils.getActiveTextEditor();
        const activeNote = VSCodeUtils.getNoteFromDocument(editor!.document);
        expect(activeNote?.fname).toEqual("foo.ch1");

        done();
      },
    });
  });
});
