import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import path from "path";
import fs from "fs-extra";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { describeSingleWS } from "../testUtilsV3";
import { tmpDir } from "@dendronhq/common-server";
import { expect } from "../testUtilsv2";
import { DoctorUtils } from "../../components/doctor/utils";
import { VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

suite("Duplicate note detection", function () {
  describeSingleWS(
    "GIVEN a duplicate note",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN duplicate note is detected", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const vaultPath = VaultUtils.getRelPath(vaults[0]);
        const barPath = path.join(wsRoot, vaultPath, "bar.md");
        const dupeNotePath = path.join(wsRoot, vaultPath, "bar-dupe.md");
        const dupeNoteUri = vscode.Uri.file(dupeNotePath);
        const barContent = fs.readFileSync(barPath, { encoding: "utf-8" });
        fs.writeFileSync(dupeNotePath, barContent, { encoding: "utf-8" });

        await VSCodeUtils.openFileInEditor(dupeNoteUri);
        const editor = VSCodeUtils.getActiveTextEditor();
        const document = editor?.document;

        const resp = await DoctorUtils.findDuplicateNoteFromDocument(document!);
        expect(resp !== undefined).toBeTruthy();
        if (resp === undefined) {
          throw Error;
        }
        const { note, duplicate } = resp;
        if (duplicate === undefined) {
          throw Error;
        }
        expect(note.id).toEqual(duplicate.id);
      });
    }
  );

  describeSingleWS(
    "GIVEN a unique note",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN duplicate is not detected", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const vaultPath = VaultUtils.getRelPath(vaults[0]);
        const barPath = path.join(wsRoot, vaultPath, "bar.md");
        const barUri = vscode.Uri.file(barPath);

        await VSCodeUtils.openFileInEditor(barUri);
        const editor = VSCodeUtils.getActiveTextEditor();
        const document = editor?.document;

        const resp = await DoctorUtils.findDuplicateNoteFromDocument(document!);
        expect(resp !== undefined).toBeTruthy();
        if (resp === undefined) {
          throw Error;
        }
        const { duplicate } = resp;
        expect(duplicate).toEqual(undefined);
      });
    }
  );

  describeSingleWS(
    "GIVEN an open file that is outside of workspace",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN do nothing", async () => {
        const outside = tmpDir().name;
        const outsideDummyPath = path.join(outside, "dummy.log");

        fs.writeFileSync(outsideDummyPath, "dummy", { encoding: "utf-8" });
        const outsideDummyUri = vscode.Uri.file(outsideDummyPath);

        await VSCodeUtils.openFileInEditor(outsideDummyUri);
        const editor = VSCodeUtils.getActiveTextEditor();
        const document = editor?.document;

        const resp = await DoctorUtils.findDuplicateNoteFromDocument(document!);
        expect(resp).toEqual(undefined);
      });
    }
  );

  describeSingleWS(
    "GIVEN an open file that is in the workspace but doesn't have frontmatter",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN do nothing", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const vaultPath = VaultUtils.getRelPath(vaults[0]);
        const noFMFilePath = path.join(wsRoot, vaultPath, "no-fm.md");
        const noFMFileUri = vscode.Uri.file(noFMFilePath);
        const noFMContent = "no frontmatter";
        fs.writeFileSync(noFMFilePath, noFMContent, { encoding: "utf-8" });

        await VSCodeUtils.openFileInEditor(noFMFileUri);
        const editor = VSCodeUtils.getActiveTextEditor();
        const document = editor?.document;

        const resp = await DoctorUtils.findDuplicateNoteFromDocument(document!);
        expect(resp?.duplicate).toEqual(undefined);
      });
    }
  );

  describeSingleWS(
    "GIVEN an open file that has been deleted",
    {
      postSetupHook: ENGINE_HOOKS.setupEmpty,
    },
    () => {
      test("THEN do nothing", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;

        await NoteTestUtilsV4.createNoteWithEngine({
          fname: "deleted",
          vault: vaults[0],
          wsRoot,
          body: "note will be deleted",
          engine,
        });

        const vaultPath = VaultUtils.getRelPath(vaults[0]);
        const deletedFilePath = path.join(wsRoot, vaultPath, "deleted.md");
        const deletedFileUri = vscode.Uri.file(deletedFilePath);
        await VSCodeUtils.openFileInEditor(deletedFileUri);

        fs.unlinkSync(deletedFilePath);

        await VSCodeUtils.openFileInEditor(deletedFileUri);
        const editor = VSCodeUtils.getActiveTextEditor();
        const document = editor?.document;

        const resp = await DoctorUtils.findDuplicateNoteFromDocument(document!);
        expect(resp).toEqual(undefined);
      });
    }
  );
});
