import { NoteProps } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describeMultiWS } from "../testUtilsV3";
import * as vscode from "vscode";
import { MoveSelectionToCommand } from "../../commands/MoveSelectionToCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describe } from "mocha";
import { expect } from "../testUtilsv2";

suite("MoveSelectionToCommand", function () {
  describe("GIVEN a note and valid selection", () => {
    let activeNote: NoteProps;
    describeMultiWS(
      "WHEN moving to new note",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          activeNote = await NoteTestUtilsV4.createNote({
            fname: "active",
            vault: vaults[0],
            wsRoot,
            body: [
              "## Stuff",
              "one",
              "two",
              "three",
              "",
              "some text ^test",
              "",
              "same file [[#^test]]",
            ].join("\n"),
            genRandomId: true,
          });
          await NoteTestUtilsV4.createNote({
            fname: "refnote",
            vault: vaults[0],
            wsRoot,
            body: [
              "[[stuff|active#stuff]]",
              "[[link to anchor|active#^test]]",
            ].join("\n"),
            genRandomId: true,
          });
        },
        timeout: 3e3,
      },
      () => {
        test("THEN selection is moved to destination, selection is replaced, and backlinks are updated", async () => {
          const extension = ExtensionProvider.getExtension();
          const vaults = await extension.getDWorkspace().vaults;
          await extension.wsUtils.openNote(activeNote);
          const editor = vscode.window.activeTextEditor;
          const cmd = new MoveSelectionToCommand(extension);
          editor!.selection = new vscode.Selection(
            new vscode.Position(7, 0),
            new vscode.Position(13, 0)
          );

          await cmd.run({
            initialValue: "newNote",
            noConfirm: true,
          });
          const originalNote = (
            await extension.getEngine().findNotes({
              fname: "active",
              vault: vaults[0],
            })
          )[0];
          expect(originalNote.body.includes("## Stuff")).toBeFalsy();
          expect(originalNote.body.includes("same file [[newNote#^test]]"));

          const newNote = (
            await extension.getEngine().findNotes({
              fname: "newNote",
              vault: vaults[0],
            })
          )[0];
          expect(newNote).toBeTruthy();
          expect(newNote.body.trim()).toEqual(
            "## Stuff\none\ntwo\nthree\n\nsome text ^test"
          );
          const postRunRefNote = (
            await extension.getEngine().findNotes({
              fname: "refnote",
              vault: vaults[0],
            })
          )[0];
          expect(postRunRefNote.body).toEqual(
            "[[stuff|newNote#stuff]]\n[[link to anchor|newNote#^test]]"
          );
        });
      }
    );

    describeMultiWS(
      "WHEN moving to existing note",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          activeNote = await NoteTestUtilsV4.createNote({
            fname: "active",
            vault: vaults[0],
            wsRoot,
            body: [
              "## Stuff",
              "one",
              "two",
              "three",
              "",
              "some text ^test",
              "",
              "same file [[#^test]]",
            ].join("\n"),
            genRandomId: true,
          });
          await NoteTestUtilsV4.createNote({
            fname: "refnote",
            vault: vaults[0],
            wsRoot,
            body: [
              "[[stuff|active#stuff]]",
              "[[link to anchor|active#^test]]",
            ].join("\n"),
            genRandomId: true,
          });
          await NoteTestUtilsV4.createNote({
            fname: "anotherNote",
            vault: vaults[0],
            wsRoot,
            body: "anotherNote",
            genRandomId: true,
          });
        },
      },
      () => {
        test("THEN selection is moved to destination, selection is replaced, and backlinks are updated", async () => {
          const extension = ExtensionProvider.getExtension();
          const vaults = await extension.getDWorkspace().vaults;
          await extension.wsUtils.openNote(activeNote);
          const editor = vscode.window.activeTextEditor;
          const cmd = new MoveSelectionToCommand(extension);
          editor!.selection = new vscode.Selection(
            new vscode.Position(7, 0),
            new vscode.Position(13, 0)
          );

          await cmd.run({
            initialValue: "anotherNote",
            noConfirm: true,
          });

          const originalNote = (
            await extension.getEngine().findNotes({
              fname: "active",
              vault: vaults[0],
            })
          )[0];
          expect(originalNote.body.includes("## Stuff")).toBeFalsy();
          expect(originalNote.body.includes("same file [[newNote#^test]]"));
          const anotherNote = (
            await extension.getEngine().findNotes({
              fname: "anotherNote",
              vault: vaults[0],
            })
          )[0];
          expect(anotherNote.body.trim()).toEqual(
            "anotherNote\n\n## Stuff\none\ntwo\nthree\n\nsome text ^test"
          );
          const postRunRefNote = (
            await extension.getEngine().findNotes({
              fname: "refnote",
              vault: vaults[0],
            })
          )[0];
          expect(postRunRefNote.body).toEqual(
            "[[stuff|anotherNote#stuff]]\n[[link to anchor|anotherNote#^test]]"
          );
        });
      }
    );
  });
});
