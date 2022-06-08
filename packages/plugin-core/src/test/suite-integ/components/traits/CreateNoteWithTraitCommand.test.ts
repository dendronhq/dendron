import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import { CreateNoteWithTraitCommand } from "../../../../commands/CreateNoteWithTraitCommand";
import { VSCodeUtils } from "../../../../vsCodeUtils";
import { getDWorkspace } from "../../../../workspace";
import { MockDendronExtension } from "../../../MockDendronExtension";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS } from "../../../testUtilsV3";
import { TestTrait } from "./TestTrait";

suite("CreateNoteWithTraitCommand tests", () => {
  describeSingleWS("GIVEN a Note Trait", {}, (ctx) => {
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

        const mockExtension = new MockDendronExtension({
          engine,
          wsRoot,
          context: ctx,
        });

        const cmd = new CreateNoteWithTraitCommand(
          mockExtension,
          "test-create-note-with-trait",
          testTrait
        );

        await cmd.execute({ fname: "test" });

        const expectedFName = path.join(wsRoot, vaults[0].fsPath, "test.md");

        expect(VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath).toEqual(
          expectedFName
        );

        const props = (
          await engine.findNotes({
            fname: "test",
            vault: vaults[0],
          })
        )[0];

        expect(props?.title).toEqual(testTrait.TEST_TITLE_MODIFIER);
      });
    });
  });
});
