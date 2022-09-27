import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { CreateJournalNoteCommand } from "../../commands/CreateJournalNoteCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect, getNoteFromTextEditor } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

suite("CreateJournalNoteCommand", function () {
  describeMultiWS(
    "GIVEN command executed",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN journal note with correct name created.", async () => {
        const ext = ExtensionProvider.getExtension();
        const wsUtils = ext.wsUtils;
        const cmd = new CreateJournalNoteCommand(ext);
        const { engine } = ext.getDWorkspace();
        const note = (await engine.getNoteMeta("foo")).data!;
        await wsUtils.openNote(note);
        await cmd.run({ noConfirm: true });
        const activeNote = getNoteFromTextEditor();
        expect(activeNote.fname.startsWith("foo.journal.")).toBeTruthy();
      });
    }
  );
});
