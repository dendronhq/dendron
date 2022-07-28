import { describe, afterEach, beforeEach, test } from "mocha";
import type { NoteProps } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { LockPreviewCommand } from "../../commands/LockPreview";
import { PreviewPanelFactory } from "../../components/views/PreviewViewFactory";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { PreviewPanel } from "../../components/views/PreviewPanel";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";

suite("GIVEN LockPreview", function () {
  let previewPanel: PreviewPanel;
  let cmd: LockPreviewCommand;

  beforeEach(() => {
    previewPanel = PreviewPanelFactory.create(
      ExtensionProvider.getExtension()
    ) as PreviewPanel;
    cmd = new LockPreviewCommand(previewPanel);
  });

  afterEach(async () => {
    await VSCodeUtils.closeAllEditors();
  });

  describeSingleWS("WHEN locking preview from the command bar", {}, () => {
    beforeEach(() => {
      previewPanel.unlock(); // reset
    });
    describe("AND preview is hidden", () => {
      test("THEN preview should be NOT locked", async () => {
        await cmd.run();
        expect(previewPanel.isLocked()).toBeFalsy();
      });
    });

    describe("AND preview just opened", () => {
      let note1: NoteProps;
      let note2: NoteProps;
      beforeEach(async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        note1 = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          wsRoot,
          vault: vaults[0],
          fname: "preview-test",
        });
        await ExtensionProvider.getWSUtils().openNote(note1);
        await previewPanel.show(note1);
      });
      test("THEN preview should be locked and pristine", async () => {
        await cmd.run();
        expect(previewPanel.isLockedAndDirty()).toBeFalsy();
      });
      describe("AND has been locked", () => {
        beforeEach(async () => {
          await cmd.run();
        });
        test("THEN preview should stay locked and pristine", async () => {
          await cmd.run();
          expect(previewPanel.isLockedAndDirty()).toBeFalsy();
        });

        describe("AND changing note", () => {
          beforeEach(async () => {
            const { engine, wsRoot, vaults } =
              ExtensionProvider.getDWorkspace();
            note2 = await NoteTestUtilsV4.createNoteWithEngine({
              engine,
              wsRoot,
              vault: vaults[0],
              fname: "preview-test-2",
            });
            await ExtensionProvider.getWSUtils().openNote(note2);
            await previewPanel.show(note2);
          });
          test("THEN preview should be locked and dirty", () => {
            expect(previewPanel.isLockedAndDirty()).toBeTruthy();
          });
        });
      });
    });
  });
});
