import * as vscode from "vscode";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { CapitalizeCommand } from "../../commands/Capitalize";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describeSingleWS } from "../testUtilsV3";
import { expect } from "../testUtilsv2";
import { before } from "mocha";

suite("Capitalize", function () {
  this.timeout(2e5);

  let cmd: CapitalizeCommand;

  before(() => {
    cmd = new CapitalizeCommand();
  });

  describeSingleWS(
    "GIVEN a basic setup on a single vault workspace",
    {},
    () => {
      test("WHEN there is no active editor, THEN Capitalize should throw an error", async () => {
        await expect(cmd.execute()).toThrow();
      });

      test("WHEN no text is selected, THEN Capitalize should not change anything", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();

        // Create a new note to test
        const note = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "no-text",
          vault: vaults[0],
          wsRoot,
          body: "hello",
          engine,
        });

        // Open an editor
        await ExtensionProvider.getExtension().wsUtils.openNote(note);

        await cmd.execute();

        // Positon of the text
        const start = new vscode.Position(7, 0);
        const end = new vscode.Position(7, 5);
        const range = new vscode.Range(start, end);

        // Open the note again to get the latest version
        const final = await ExtensionProvider.getExtension().wsUtils.openNote(
          note
        );

        expect(final.document.getText(range)).toEqual("hello");
      });

      test("WHEN all lower case text is selected, THEN Capitalize should change all letters to upper case", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();

        // Create a new note to test
        const note = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "text",
          vault: vaults[0],
          wsRoot,
          body: "hello",
          engine,
        });

        // Open an editor
        const editor = await ExtensionProvider.getExtension().wsUtils.openNote(
          note
        );

        // Position of the text
        const start = new vscode.Position(7, 0);
        const end = new vscode.Position(7, 5);

        // Select the text
        editor.selection = new vscode.Selection(start, end);

        await cmd.execute();

        // Open the note again to get the latest version
        const final = await ExtensionProvider.getExtension().wsUtils.openNote(
          note
        );

        expect(final.document.getText(editor.selection)).toEqual("HELLO");
      });

      test("WHEN text with upper and lower cases letters is selected, THEN Capitalize should change all lower case letters to upper case", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();

        // Create a new note to test
        const note = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "mixed-text",
          vault: vaults[0],
          wsRoot,
          body: "HelLo worLd",
          engine,
        });

        // Open an editor
        const editor = await ExtensionProvider.getExtension().wsUtils.openNote(
          note
        );

        // Position of the text
        const start = new vscode.Position(7, 0);
        const end = new vscode.Position(7, 11);

        // Select the text
        editor.selection = new vscode.Selection(start, end);

        await cmd.execute();

        // Open the note again to get the latest version
        const final = await ExtensionProvider.getExtension().wsUtils.openNote(
          note
        );

        expect(final.document.getText(editor.selection)).toEqual("HELLO WORLD");
      });
    }
  );
});
