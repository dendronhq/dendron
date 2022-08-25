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
      timeout: 1e4,
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

          const testTrait = new TestTrait("foo");

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
        test(`WHEN cross vault template is given, THEN correct template should be applied`, async () => {
          const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const testTrait = new TestTrait("dendron://vault1/bar");
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

          await cmd.execute({ fname: "xvault", vaultOverride: vaults[1] });

          const expectedFName = path.join(
            wsRoot,
            VaultUtils.getRelPath(vaults[1]),
            "xvault.md"
          );

          expect(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath
          ).toEqual(expectedFName);

          const props = (
            await engine.findNotes({
              fname: "xvault",
              vault: vaults[1],
            })
          )[0];

          expect(props?.title).toEqual(testTrait.TEST_TITLE_MODIFIER);
          expect(props?.body).toEqual("bar body");
        });

        test(`WHEN setVault is implemented, a new note should be created in the specified vault`, async () => {
          const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const testTrait = new TestTrait("dendron://vault1/bar");
          testTrait.OnCreate.setVault = () => VaultUtils.getName(vaults[2]);
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

          await cmd.execute({ fname: "xvault", vaultOverride: vaults[1] });

          const expectedFName = path.join(
            wsRoot,
            VaultUtils.getRelPath(vaults[2]),
            "xvault.md"
          );

          expect(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath
          ).toEqual(expectedFName);
        });
      });
    }
  );
});
