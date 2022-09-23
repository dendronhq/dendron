import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { CreateMeetingNoteCommand } from "../../commands/CreateMeetingNoteCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect, getNoteFromTextEditor } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

suite("GIVEN CreateMeetingNoteCommand in a basic workspace", function () {
  const TEMPLATE_BODY = "test template";

  describeMultiWS(
    "WHEN CreateMeetingNoteCommand is executed once",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
      timeout: 5e3,
    },
    () => {
      test("THEN meeting note with correct name created.", async () => {
        const ext = ExtensionProvider.getExtension();
        const wsUtils = ext.wsUtils;
        const cmd = new CreateMeetingNoteCommand(ext, true);
        const { engine } = ext.getDWorkspace();

        const note = (await engine.getNoteMeta("foo")).data!;

        await wsUtils.openNote(note);
        await cmd.run();
        const activeNote = getNoteFromTextEditor();
        expect(activeNote.fname.startsWith("meet.")).toBeTruthy();
      });

      test("AND the meeting note trait ID is set", async () => {
        const ext = ExtensionProvider.getExtension();
        const wsUtils = ext.wsUtils;
        const cmd = new CreateMeetingNoteCommand(ext, true);
        const { engine } = ext.getDWorkspace();

        const note = (await engine.getNoteMeta("foo")).data!;

        await wsUtils.openNote(note);
        await cmd.run();
        const activeNote = getNoteFromTextEditor();

        // TODO: traits isn't exposed in newNote props here because in the test
        //we extract noteProps via `getNoteFromTextEditor` instead of the
        //engine. So for now, test via the raw traitIds that should have been
        //added to the note.
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "meetingNote").toBeTruthy();
      });

      test("AND the meeting note template has been applied", async () => {
        const ext = ExtensionProvider.getExtension();
        const wsUtils = ext.wsUtils;
        const cmd = new CreateMeetingNoteCommand(ext, true);
        const { engine } = ext.getDWorkspace();

        const note = (await engine.getNoteMeta("foo")).data!;

        await wsUtils.openNote(note);
        await cmd.run();
        const activeNote = getNoteFromTextEditor();

        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
      });
    }
  );
});
