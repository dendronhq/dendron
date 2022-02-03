import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { CreateScratchNoteCommand } from "../../commands/CreateScratchNoteCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect, getNoteFromTextEditor } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";

suite("CreateScratchNoteCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);
  describeMultiWS(
    "GIVEN command executed",
    {
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN scratch note with correct name created.", async () => {
        const ext = ExtensionProvider.getExtension();
        const wsUtils = ext.wsUtils;
        const cmd = new CreateScratchNoteCommand();
        const { vaults, engine } = ext.getDWorkspace();
        const note = NoteUtils.getNoteByFnameFromEngine({
          fname: "foo",
          vault: vaults[0],
          engine,
        }) as NoteProps;
        await wsUtils.openNote(note);
        await cmd.run({ noConfirm: true });
        const activeNote = getNoteFromTextEditor();

        expect(activeNote.fname.startsWith("scratch.")).toBeTruthy();
      });
    }
  );
});
