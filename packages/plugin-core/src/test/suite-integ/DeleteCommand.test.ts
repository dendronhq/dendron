import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describeSingleWS } from "../testUtilsV3";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { DeleteCommand } from "../../commands/DeleteCommand";
import sinon from "sinon";
import { expect } from "../testUtilsv2";
import { VaultUtils } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { Utils } from "vscode-uri";

suite("Delete Command", function () {
  describeSingleWS(
    "GIVEN a note open in text editor and Delete Command is run",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
      timeout: 1e6,
    },
    () => {
      test("WHEN selected proceed to delete THEN delete the note", async () => {
        const engine = ExtensionProvider.getEngine();
        const deleteCmd = new DeleteCommand();
        sinon.stub(deleteCmd, "promptConfirmation").resolves(true);
        const note = (await engine.findNotesMeta({ fname: "bar" }))[0];
        await WSUtilsV2.instance().openNote(note);
        const resp = await deleteCmd.execute();
        expect(resp?.error).toEqual(undefined);
        const noteAfterDelete = await engine.findNotesMeta({ fname: "bar" });
        expect(noteAfterDelete).toEqual([]);
      });
      test("WHEN noConfirm: true is sent via keyvinding args THEN delete the note", async () => {
        const engine = ExtensionProvider.getEngine();
        const deleteCmd = new DeleteCommand();
        const note = (await engine.findNotesMeta({ fname: "foo.ch1" }))[0];
        await WSUtilsV2.instance().openNote(note);
        const resp = await deleteCmd.execute({ noConfirm: true });
        expect(resp?.error).toEqual(undefined);
        const noteAfterDelete = await engine.findNotesMeta({
          fname: "foo.ch1",
        });
        expect(noteAfterDelete).toEqual([]);
      });
    }
  );
  describeSingleWS(
    "GIVEN Delete Command is run from Explorer Menu for a note",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
      timeout: 1e6,
    },
    () => {
      test("THEN delete the note", async () => {
        const engine = ExtensionProvider.getEngine();
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const vaultPath = VaultUtils.getRelPath(vaults[0]);
        const barUri = Utils.joinPath(
          vscode.Uri.file(wsRoot),
          vaultPath,
          "bar.md"
        );
        const deleteCmd = new DeleteCommand();
        sinon.stub(deleteCmd, "promptConfirmation").resolves(true);
        await engine.findNotesMeta({ fname: "bar" });
        const resp = await deleteCmd.execute(barUri);
        expect(resp?.error).toEqual(undefined);
        const noteAfterDelete = await engine.findNotesMeta({ fname: "bar" });
        expect(noteAfterDelete).toEqual([]);
      });
    }
  );
  describeSingleWS(
    "GIVEN Delete Command is run from Tree View Context Menu for a note",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
      timeout: 1e6,
    },
    () => {
      test("THEN delete the note", async () => {
        const engine = ExtensionProvider.getEngine();
        const deleteCmd = new DeleteCommand();
        sinon.stub(deleteCmd, "promptConfirmation").resolves(true);
        const note = (await engine.findNotesMeta({ fname: "bar" }))[0];
        const resp = await deleteCmd.execute(note.id);
        expect(resp?.error).toEqual(undefined);
        const noteAfterDelete = await engine.findNotesMeta({ fname: "bar" });
        expect(noteAfterDelete).toEqual([]);
      });
    }
  );
});
