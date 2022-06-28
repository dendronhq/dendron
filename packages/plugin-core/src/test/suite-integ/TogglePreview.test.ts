import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { test, before } from "mocha";
import { TogglePreviewCommand } from "../../commands/TogglePreview";
import { PreviewPanelFactory } from "../../components/views/PreviewViewFactory";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect } from "../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../testUtilsV3";
import vscode from "vscode";
import { VSCodeUtils } from "../../vsCodeUtils";
import fs from "fs-extra";
import path from "path";

suite("GIVEN ShowPreview", function () {
  const ctx = setupBeforeAfter(this);

  describeSingleWS(
    "WHEN opening the preview from the command bar",
    {
      ctx,
    },
    () => {
      let note: NoteProps;
      before(async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        note = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          wsRoot,
          vault: vaults[0],
          fname: "preview-test",
        });
        // Open the note so that's the current note
        await ExtensionProvider.getWSUtils().openNote(note);
      });
      test("THEN the current note is opened", async () => {
        const cmd = new TogglePreviewCommand(
          PreviewPanelFactory.create(ExtensionProvider.getExtension())
        );
        const out = await cmd.run();
        expect(out?.note).toBeTruthy();
        expect(out!.note!.id).toEqual(note.id);
        expect(out!.note!.fname).toEqual(note.fname);
        await cmd.run();
      });
    }
  );

  describeSingleWS(
    "WHEN opening the preview from a context menu AND a note is open",
    {
      ctx,
    },
    () => {
      let note: NoteProps;
      before(async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        note = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          wsRoot,
          vault: vaults[0],
          fname: "preview-test",
        });
        const wrongNote = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          wsRoot,
          vault: vaults[0],
          fname: "wrong-note",
        });
        // A different note is open this time
        await ExtensionProvider.getWSUtils().openNote(wrongNote);
      });
      test("THEN the selected note is opened", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const cmd = new TogglePreviewCommand(
          PreviewPanelFactory.create(ExtensionProvider.getExtension())
        );
        // When opened from a menu, the file path will be passed as an argument
        const path = vscode.Uri.file(NoteUtils.getFullPath({ note, wsRoot }));
        const out = await cmd.run(path);
        expect(out?.note).toBeTruthy();
        expect(out!.note!.id).toEqual(note.id);
        expect(out!.note!.fname).toEqual(note.fname);
        await cmd.run();
      });
    }
  );

  describeSingleWS(
    "WHEN opening the preview from a context menu AND no note is open",
    {
      ctx,
    },
    () => {
      let note: NoteProps;
      before(async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        note = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          wsRoot,
          vault: vaults[0],
          fname: "preview-test",
        });
        // Make sure no note is open
        await VSCodeUtils.closeAllEditors();
      });
      test("THEN the selected note is opened", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const cmd = new TogglePreviewCommand(
          PreviewPanelFactory.create(ExtensionProvider.getExtension())
        );
        // When opened from a menu, the file path will be passed as an argument
        const path = vscode.Uri.file(NoteUtils.getFullPath({ note, wsRoot }));
        const out = await cmd.run(path);
        expect(out?.note).toBeTruthy();
        expect(out!.note!.id).toEqual(note.id);
        expect(out!.note!.fname).toEqual(note.fname);
        await cmd.run();
      });
    }
  );

  describeSingleWS(
    "WHEN opening a non-note file from the content menu",
    {
      ctx,
    },
    () => {
      let fsPath: string;
      before(async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        fsPath = path.join(wsRoot, "foo-bar.md");
        await fs.writeFile(fsPath, "foo bar");
        // Make sure no note is open
        await VSCodeUtils.closeAllEditors();
      });
      test("THEN the selected non-note file is opened", async () => {
        const cmd = new TogglePreviewCommand(
          PreviewPanelFactory.create(ExtensionProvider.getExtension())
        );
        // When opened from a menu, the file path will be passed as an argument
        const path = vscode.Uri.file(fsPath);
        const out = await cmd.run(path);
        expect(out?.fsPath).toEqual(fsPath);
        await cmd.run();
      });
    }
  );

  describeSingleWS(
    "WHEN opening a non-note file from the command bar",
    {
      ctx,
    },
    () => {
      let fsPath: string;
      let uri: vscode.Uri;
      before(async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        fsPath = path.join(wsRoot, "foo-bar.md");
        await fs.writeFile(fsPath, "foo bar");
        uri = vscode.Uri.file(fsPath);
        await VSCodeUtils.openFileInEditor(uri);
      });
      test("THEN the current non-note file is opened", async () => {
        const cmd = new TogglePreviewCommand(
          PreviewPanelFactory.create(ExtensionProvider.getExtension())
        );
        const out = await cmd.run();
        expect(out?.fsPath).toEqual(fsPath);
        await cmd.run();
      });
    }
  );

  describeSingleWS(
    "WHEN preview is open for a note containing link with .md in its name", //[[lorem.ipsum.mdone.first]]
    {
      ctx,
    },
    () => {
      let note: NoteProps;
      before(async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          wsRoot,
          vault: vaults[0],
          fname: "lorem.ipsum.mdone.first",
          body: "Lorem ipsum",
        });
        note = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          wsRoot,
          vault: vaults[0],
          fname: "preview-link-test",
          body: "[[lorem.ipsum.mdone.first]]",
        });
      });
      test("THEN preview must link to the correct note", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const cmd = new TogglePreviewCommand(
          PreviewPanelFactory.create(ExtensionProvider.getExtension())
        );
        // When opened from a menu, the file path will be passed as an argument
        const path = vscode.Uri.file(NoteUtils.getFullPath({ note, wsRoot }));
        const out = await cmd.run(path);
        expect(out?.note).toBeTruthy();
        expect(out!.note!.fname).toEqual(note.fname);
        const links = out!.note!.links;
        expect(links[0].value).toEqual("lorem.ipsum.mdone.first");
        await cmd.run();
      });
    }
  );

  describeSingleWS(
    "WHEN preview panel is already open",
    {
      ctx,
    },
    () => {
      /* Create and open a note */
      let note: NoteProps;
      before(async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        note = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          wsRoot,
          vault: vaults[0],
          fname: "preview-test",
        });
        // Open the note so that's the current note
        await ExtensionProvider.getWSUtils().openNote(note);
      });

      test("THEN the preview should be hidden", async () => {
        const cmd = new TogglePreviewCommand(
          PreviewPanelFactory.create(ExtensionProvider.getExtension())
        );

        /* When the preview is hidden, the command retruns undefined */
        await cmd.run();
        const out = await cmd.run();
        expect(out?.note).toBeFalsy();
        await cmd.run();
      });
    }
  );
});
