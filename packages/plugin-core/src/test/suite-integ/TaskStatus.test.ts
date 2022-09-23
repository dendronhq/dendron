import _ from "lodash";
import sinon from "sinon";
import { expect, LocationTestUtils } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";
import { before, after, describe } from "mocha";
import { NoteProps } from "@dendronhq/common-all";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { NoteTestUtilsV4, SinonStubbedFn } from "@dendronhq/common-test-utils";
import { TaskStatusCommand } from "../../commands/TaskStatus";

suite("GIVEN TaskStatus", function () {
  this.timeout(5e3);

  describeSingleWS("WHEN a link to a task note is selected", {}, () => {
    let taskNote: NoteProps;
    let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;
    before(async () => {
      const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
      const extension = ExtensionProvider.getExtension();
      showQuickPick = sinon.stub(VSCodeUtils, "showQuickPick").resolves({
        label: "y",
      });
      taskNote = await NoteTestUtilsV4.createNoteWithEngine({
        engine,
        fname: "task.test",
        vault: vaults[0],
        wsRoot,
        body: "",
        custom: {
          status: "",
        },
      });
      const currentNote = await NoteTestUtilsV4.createNoteWithEngine({
        engine,
        fname: "base",
        vault: vaults[0],
        wsRoot,
        body: "[[task.test]]",
      });
      const editor = await ExtensionProvider.getWSUtils().openNote(currentNote);
      editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

      const cmd = new TaskStatusCommand(extension);
      await cmd.run();
    });
    after(() => {
      showQuickPick.restore();
    });

    test("THEN prompts for the status", () => {
      expect(showQuickPick.calledOnce).toBeTruthy();
    });
    test("THEN updates the task status", async () => {
      const { engine } = ExtensionProvider.getDWorkspace();
      const task = (
        await engine.findNotesMeta({
          fname: "task.test",
          vault: taskNote.vault,
        })
      )[0];
      expect(task?.custom.status === "y");
    });
  });

  describeSingleWS("WHEN a broken link is selected", {}, () => {
    let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;
    before(async () => {
      const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
      const extension = ExtensionProvider.getExtension();
      showQuickPick = sinon.stub(VSCodeUtils, "showQuickPick").resolves({
        label: "y",
      });
      const currentNote = await NoteTestUtilsV4.createNoteWithEngine({
        engine,
        fname: "base",
        vault: vaults[0],
        wsRoot,
        body: "[[task.test]]",
      });
      const editor = await ExtensionProvider.getWSUtils().openNote(currentNote);
      editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

      const cmd = new TaskStatusCommand(extension);
      await cmd.run();
    });
    after(() => {
      showQuickPick.restore();
    });

    test("THEN didn't prompt for the status", () => {
      expect(showQuickPick.called).toBeFalsy();
    });
  });

  describeMultiWS(
    "WHEN the selected link is ambiguous",
    // test is flaky
    { timeout: 1e4 },
    () => {
      let taskNote: NoteProps;
      let otherTaskNote: NoteProps;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;
      before(async () => {
        const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
        const extension = ExtensionProvider.getExtension();

        taskNote = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          fname: "task.test",
          vault: vaults[0],
          wsRoot,
          body: "",
          genRandomId: true,
          custom: {
            status: "",
          },
        });
        otherTaskNote = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          fname: "task.test",
          vault: vaults[1],
          wsRoot,
          body: "",
          genRandomId: true,
          custom: {
            status: "",
          },
        });
        const currentNote = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          fname: "base",
          vault: vaults[0],
          wsRoot,
          body: "[[task.test]]",
        });
        const editor = await ExtensionProvider.getWSUtils().openNote(
          currentNote
        );
        editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

        showQuickPick = sinon.stub(VSCodeUtils, "showQuickPick");
        showQuickPick
          .onFirstCall()
          .resolves({ label: taskNote.title, detail: taskNote.vault.fsPath });
        showQuickPick.onSecondCall().resolves({
          label: "y",
        });

        const cmd = new TaskStatusCommand(extension);
        await cmd.run();
      });
      after(() => {
        showQuickPick.restore();
      });

      test("THEN prompts for the note and the status", () => {
        expect(showQuickPick.callCount).toEqual(2);
      });
      test("THEN updates the task status for the right task", async () => {
        const { engine } = ExtensionProvider.getDWorkspace();
        const task = (await engine.getNote(taskNote.id)).data;
        expect(task?.custom.status === "y");
        const otherTask = (await engine.getNote(otherTaskNote.id)).data;
        expect(_.isEmpty(otherTask?.custom?.status)).toBeTruthy();
      });
    }
  );

  describe("WHEN no link is selected", () => {
    describeMultiWS("AND a task note is open", {}, () => {
      let taskNote: NoteProps;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;
      before(async () => {
        const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
        const extension = ExtensionProvider.getExtension();

        taskNote = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          fname: "task.test",
          vault: vaults[0],
          wsRoot,
          body: "",
          genRandomId: true,
          custom: {
            status: "",
          },
        });
        await ExtensionProvider.getWSUtils().openNote(taskNote);
        showQuickPick = sinon
          .stub(VSCodeUtils, "showQuickPick")
          .resolves({ label: "y" });

        const cmd = new TaskStatusCommand(extension);
        await cmd.run();
      });

      test("THEN prompts for the status", () => {
        expect(showQuickPick.calledOnce).toBeTruthy();
      });
      test("THEN sets the status for the current note", async () => {
        const { engine } = ExtensionProvider.getDWorkspace();
        const task = (await engine.getNote(taskNote.id)).data;
        expect(task?.custom.status === "y");
      });
    });

    describeMultiWS("AND the current note is NOT a task", {}, () => {
      let otherNote: NoteProps;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;
      before(async () => {
        const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
        const extension = ExtensionProvider.getExtension();

        otherNote = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          fname: "test",
          vault: vaults[0],
          wsRoot,
          body: "",
        });
        await ExtensionProvider.getWSUtils().openNote(otherNote);
        showQuickPick = sinon
          .stub(VSCodeUtils, "showQuickPick")
          .resolves({ label: "y" });

        const cmd = new TaskStatusCommand(extension);
        await cmd.run();
      });

      test("THEN doesn't prompt for the status", () => {
        expect(showQuickPick.called).toBeFalsy();
      });
      test("THEN doesn't set a status for the current note", async () => {
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = (await engine.getNote(otherNote.id)).data;
        expect(note?.custom?.status === undefined).toBeTruthy();
      });
    });

    describeMultiWS("AND no note is open", {}, () => {
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;
      before(async () => {
        const extension = ExtensionProvider.getExtension();

        await VSCodeUtils.closeAllEditors();
        showQuickPick = sinon
          .stub(VSCodeUtils, "showQuickPick")
          .resolves({ label: "y" });

        const cmd = new TaskStatusCommand(extension);
        await cmd.run();
      });

      test("THEN doesn't prompt for the status", () => {
        expect(showQuickPick.called).toBeFalsy();
      });
    });
  });
});
