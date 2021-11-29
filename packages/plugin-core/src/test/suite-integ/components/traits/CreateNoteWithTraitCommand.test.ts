import { NoteUtils } from "@dendronhq/common-all";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import vscode from "vscode";
import { CreateNoteWithTraitCommand } from "../../../../commands/CreateNoteWithTraitCommand";
import { VSCodeUtils } from "../../../../utils";
import { getDWorkspace } from "../../../../workspace";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../../../testUtilsV3";
import { TestTrait } from "./TestTrait";

suite("CreateNoteWithTraitCommand tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  describeSingleWS("GIVEN a Note Trait", { ctx }, () => {
    describe(`WHEN creating a note with that trait applied`, () => {
      beforeEach(() => {
        VSCodeUtils.closeAllEditors();
      });

      afterEach(() => {
        VSCodeUtils.closeAllEditors();
      });

      test(`THEN expect the title to have been modified`, async () => {
        const { engine, wsRoot, vaults } = getDWorkspace();
        const testTrait = new TestTrait();
        const cmd = new CreateNoteWithTraitCommand(
          "test-create-note-with-trait",
          testTrait
        );

        await cmd.execute({ fname: "test" });

        const expectedFName = path.join(wsRoot, vaults[0].fsPath, "test.md");

        expect(VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath).toEqual(
          expectedFName
        );

        const props = NoteUtils.getNoteByFnameV5({
          fname: "test",
          notes: engine.notes,
          vault: vaults[0],
          wsRoot,
        });

        expect(props?.title).toEqual(testTrait.TEST_TITLE_MODIFIER);
      });
    });
  });
});
