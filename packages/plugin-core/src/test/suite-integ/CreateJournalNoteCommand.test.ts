// import { NoteProps, NoteUtils } from "@dendronhq/common-all";
// import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
// import * as vscode from "vscode";
// import { CreateJournalNoteCommand } from "../../commands/CreateJournalNoteCommand";
// import { ExtensionProvider } from "../../ExtensionProvider";
// import { expect, getNoteFromTextEditor } from "../testUtilsv2";
// import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";

// suite("CreateJournalNoteCommand", function () {
//   let ctx: vscode.ExtensionContext;
//   ctx = setupBeforeAfter(this);
//   describeMultiWS(
//     "GIVEN command executed",
//     {
//       ctx,
//       preSetupHook: ENGINE_HOOKS.setupBasic,
//     },
//     () => {
//       test("THEN journal note with correct name created.", async () => {
//         const ext = ExtensionProvider.getExtension();
//         const wsUtils = ext.wsUtils;
//         const cmd = new CreateJournalNoteCommand(ext);
//         const { vaults, engine } = ext.getDWorkspace();
//         const note = NoteUtils.getNoteByFnameFromEngine({
//           fname: "foo",
//           vault: vaults[0],
//           engine,
//         }) as NoteProps;
//         await wsUtils.openNote(note);
//         await cmd.run({ noConfirm: true });
//         const activeNote = getNoteFromTextEditor();
//         expect(activeNote.fname.startsWith("foo.journal.")).toBeTruthy();
//       });
//     }
//   );
// });
