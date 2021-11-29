import { CONSTANTS } from "@dendronhq/common-all";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import vscode from "vscode";
import { RegisterNoteTraitCommand } from "../../../../commands/RegisterNoteTraitCommand";
import { VSCodeUtils } from "../../../../utils";
import { getDWorkspace } from "../../../../workspace";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../../../testUtilsV3";

suite("RegisterNoteTraitCommand tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  describeSingleWS("GIVEN a new Note Trait", { ctx }, () => {
    describe(`WHEN registering a new note trait`, () => {
      beforeEach(() => {
        VSCodeUtils.closeAllEditors();
      });

      afterEach(() => {
        VSCodeUtils.closeAllEditors();
      });

      const traitId = "new-test-trait";

      test(`THEN expect the note trait editor to be visible`, async () => {
        const { wsRoot } = getDWorkspace();
        const cmd = new RegisterNoteTraitCommand();

        await cmd.execute({
          typeId: traitId,
        });

        expect(VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath).toEqual(
          path.join(
            wsRoot,
            CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE,
            `${traitId}.js`
          )
        );
      });
    });
  });
});
