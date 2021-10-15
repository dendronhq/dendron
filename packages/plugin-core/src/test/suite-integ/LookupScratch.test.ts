import { LegacyNoteAddBehavior, NoteUtils } from "@dendronhq/common-all";
import { NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import * as vscode from "vscode";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "../../components/lookup/types";
import { VSCodeUtils } from "../../utils";
import { getDWorkspace } from "../../workspace";
import {
  expect,
  getNoteFromFname,
  getNoteFromTextEditor,
} from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("Scratch Notes", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  describe("single", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          const fname = NOTE_PRESETS_V4.NOTE_SIMPLE.fname;
          const notes = getDWorkspace().engine.notes;
          const note = NoteUtils.getNoteByFnameV5({
            fname,
            notes,
            vault,
            wsRoot: getDWorkspace().wsRoot,
          });
          const editor = await VSCodeUtils.openNote(note!);
          const SIMPLE_SELECTION = new vscode.Selection(7, 0, 7, 12);
          editor.selection = SIMPLE_SELECTION;
          await new NoteLookupCommand().run({
            selectionType: LookupSelectionTypeEnum.selection2link,
            noteType: LookupNoteTypeEnum.scratch,
            noConfirm: true,
          });
          const scratchNote = getNoteFromTextEditor();
          expect(scratchNote.fname.startsWith("scratch")).toBeTruthy();
          done();
        },
      });
    });

    test("domainAsNamespace", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          config.scratch!.addBehavior =
            LegacyNoteAddBehavior.childOfDomainNamespace;
          return config;
        },
        postSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD.create({
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          const { fname, selection } =
            NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD;
          const editor = await getNoteFromFname({ fname, vault });
          editor.selection = new vscode.Selection(...selection);
          await new NoteLookupCommand().run({
            selectionType: LookupSelectionTypeEnum.selection2link,
            noteType: LookupNoteTypeEnum.scratch,
            noConfirm: true,
          });
          const scratchNote = getNoteFromTextEditor();
          expect(scratchNote.fname.startsWith("pro.scratch")).toBeTruthy();
          done();
        },
      });
    });
  });

  describe("multi", () => {
    test("basic, multi", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
            vault: vaults[1],
            wsRoot,
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[1];
          const fname = NOTE_PRESETS_V4.NOTE_SIMPLE.fname;
          const notes = getDWorkspace().engine.notes;
          const note = NoteUtils.getNoteByFnameV5({
            fname,
            notes,
            vault,
            wsRoot: getDWorkspace().wsRoot,
          });
          const editor = await VSCodeUtils.openNote(note!);
          const SIMPLE_SELECTION = new vscode.Selection(7, 0, 7, 12);
          editor.selection = SIMPLE_SELECTION;
          await new NoteLookupCommand().run({
            selectionType: LookupSelectionTypeEnum.selection2link,
            noteType: LookupNoteTypeEnum.scratch,
            noConfirm: true,
          });
          const scratchNote = getNoteFromTextEditor();
          expect(scratchNote.fname.startsWith("scratch")).toBeTruthy();
          done();
        },
      });
    });

    test("domainAsNamespace", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          config.scratch!.addBehavior =
            LegacyNoteAddBehavior.childOfDomainNamespace;
          return config;
        },
        postSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD.create({
            vault: vaults[1],
            wsRoot,
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[1];
          const { fname, selection } =
            NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD;
          const editor = await getNoteFromFname({ fname, vault });
          editor.selection = new vscode.Selection(...selection);
          await new NoteLookupCommand().run({
            selectionType: LookupSelectionTypeEnum.selection2link,
            noteType: LookupNoteTypeEnum.scratch,
            noConfirm: true,
          });
          const scratchNote = getNoteFromTextEditor();
          expect(scratchNote.fname.startsWith("pro.scratch")).toBeTruthy();
          done();
        },
      });
    });
  });
});
