import { VaultUtils } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import { CreateNoteWithTraitCommand } from "../../../../commands/CreateNoteWithTraitCommand";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import { VSCodeUtils } from "../../../../vsCodeUtils";
import { MockDendronExtension } from "../../../MockDendronExtension";
import { expect } from "../../../testUtilsv2";
import { describeMultiWS } from "../../../testUtilsV3";
import { TestTrait } from "./TestTrait";

suite("CreateNoteWithTraitCommand tests", () => {
  describeMultiWS(
    "GIVEN a Note Trait",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    (ctx) => {
      describe(`WHEN creating a note with that trait applied`, () => {
        beforeEach(() => {
          VSCodeUtils.closeAllEditors();
        });

        afterEach(() => {
          VSCodeUtils.closeAllEditors();
        });

        test(`THEN expect the title to have been modified AND have the foo template applied`, async () => {
          const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const testTrait = new TestTrait();

          const mockExtension = new MockDendronExtension({
            engine,
            wsRoot,
            context: ctx,
            vaults,
          });

          const cmd = new CreateNoteWithTraitCommand(
            mockExtension,
            "test-create-note-with-trait",
            testTrait
          );

          await cmd.execute({ fname: "test" });

          const expectedFName = path.join(
            wsRoot,
            VaultUtils.getRelPath(vaults[0]),
            "test.md"
          );

          expect(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath
          ).toEqual(expectedFName);

          const props = (
            await engine.findNotes({
              fname: "test",
              vault: vaults[0],
            })
          )[0];

          expect(props?.title).toEqual(testTrait.TEST_TITLE_MODIFIER);
          expect(props?.body).toEqual("foo body");
        });
      });
    }
  );
});
