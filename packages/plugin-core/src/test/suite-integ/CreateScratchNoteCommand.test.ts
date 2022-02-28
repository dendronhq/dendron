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
        const cmd = new CreateScratchNoteCommand(ext);
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
      test("THEN selection2link is applied.", async () => {
        const ext = ExtensionProvider.getExtension();
        const wsUtils = ext.wsUtils;
        const cmd = new CreateScratchNoteCommand(ext);
        const { vaults, engine } = ext.getDWorkspace();
        const note = NoteUtils.getNoteByFnameFromEngine({
          fname: "foo",
          vault: vaults[0],
          engine,
        }) as NoteProps;
        const fooNoteEditor = await wsUtils.openNote(note);
        fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
        await cmd.run({ noConfirm: true });
        const activeNote = getNoteFromTextEditor();
        expect(activeNote.fname.endsWith(".foo-body")).toBeTruthy();
        const changedFooNoteText = fooNoteEditor.document.getText();
        expect(changedFooNoteText.endsWith(".foo-body]]\n"));
      });
    }
  );
});
