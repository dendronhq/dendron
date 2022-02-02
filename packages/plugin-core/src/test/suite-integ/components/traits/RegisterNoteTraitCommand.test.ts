import { CONSTANTS } from "@dendronhq/common-all";
import { afterEach, beforeEach, describe } from "mocha";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import path from "path";
import vscode from "vscode";
import { RegisterNoteTraitCommand } from "../../../../commands/RegisterNoteTraitCommand";
import { VSCodeUtils } from "../../../../vsCodeUtils";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../../../testUtilsV3";
import sinon from "sinon";

suite("RegisterNoteTraitCommand tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  describeSingleWS("GIVEN a new Note Trait", { ctx }, () => {
    describe(`WHEN registering a new note trait`, () => {
      beforeEach(async () => {
        await VSCodeUtils.closeAllEditors();
      });

      afterEach(async () => {
        await VSCodeUtils.closeAllEditors();
      });

      const traitId = "new-test-trait";

      test(`THEN expect the note trait editor to be visible`, async () => {
        const registerCommand = sinon.stub(vscode.commands, "registerCommand");
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const cmd = new RegisterNoteTraitCommand();

        await cmd.execute({
          traitId,
        });

        expect(registerCommand.calledOnce).toBeTruthy();
        expect(registerCommand.args[0][0]).toEqual(
          "dendron.customCommand.new-test-trait"
        );
        expect(VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath).toEqual(
          path.join(
            wsRoot,
            CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE,
            `${traitId}.js`
          )
        );
        registerCommand.restore();
      });
    });
  });
});
