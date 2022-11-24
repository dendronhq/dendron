import { describe, afterEach, beforeEach, test } from "mocha";
import type { NoteProps } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { TogglePreviewLockCommand } from "../../commands/TogglePreviewLock";
import { PreviewPanelFactory } from "../../components/views/PreviewViewFactory";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";
import { PreviewPanel } from "../../views/common/preview/PreviewPanel";
import sinon from "sinon";

suite("GIVEN TogglePreviewLock", function () {
  let previewPanel: PreviewPanel;
  let cmd: TogglePreviewLockCommand;

  beforeEach(() => {
    previewPanel = PreviewPanelFactory.create() as PreviewPanel;
    cmd = new TogglePreviewLockCommand(previewPanel);
  });

  afterEach(async () => {
    await VSCodeUtils.closeAllEditors();
    sinon.restore();
  });

  describeSingleWS(
    "WHEN locking preview from the command bar",
    { timeout: 5e3 },
    () => {
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
          const ws = ExtensionProvider.getDWorkspace();
          const { engine, wsRoot } = ws;
          const vaults = await ws.vaults;
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
          /* This stub is added to fix an issue where test cases and 
          container.resolve() take different values for wsRoot, resulting in 
          undefined results for getNoteFromDocument. */
          const wsUtils =
            previewPanel._DO_NOT_USE_EXPOSED_FOR_TESTING_wsUtilsWeb();
          sinon.stub(wsUtils, "getNoteFromDocument").resolves([note1]);
          await cmd.run();
          expect(await previewPanel.isLockedAndDirty()).toBeFalsy();
        });
        describe("AND has been locked", () => {
          beforeEach(async () => {
            await cmd.run();
          });
          test("THEN preview should toggle to unlocked", async () => {
            await cmd.run();
            expect(previewPanel.isLocked()).toBeFalsy();
          });

          describe("AND changing note", () => {
            beforeEach(async () => {
              const ws = ExtensionProvider.getDWorkspace();
              const { wsRoot, engine } = ws;
              const vaults = await ws.vaults;
              note2 = await NoteTestUtilsV4.createNoteWithEngine({
                engine,
                wsRoot,
                vault: vaults[0],
                fname: "preview-test-2",
              });
              await ExtensionProvider.getWSUtils().openNote(note2);
              await previewPanel.show(note2);
            });
            test("THEN preview should be locked and dirty", async () => {
              const wsUtils =
                previewPanel._DO_NOT_USE_EXPOSED_FOR_TESTING_wsUtilsWeb();
              sinon.stub(wsUtils, "getNoteFromDocument").resolves([note2]);
              expect(await previewPanel.isLockedAndDirty()).toBeTruthy();
            });
          });
        });
      });
    }
  );
});
