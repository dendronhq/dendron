import { NoteUtils } from "@dendronhq/common-all";
import { NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import * as vscode from "vscode";
import {
  LookupCommand,
  LookupNoteTypeEnum,
} from "../../commands/LookupCommand";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import {
  expect,
  getNoteFromFname,
  getNoteFromTextEditor,
} from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("Scratch Notes", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  ctx = setupBeforeAfter(this, {});

  describe("single", function () {
    test("basic", function (done) {
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
          const notes = getWS().getEngine().notes;
          const note = NoteUtils.getNoteByFnameV5({
            fname,
            notes,
            vault,
            wsRoot: DendronWorkspace.wsRoot(),
          });
          const editor = await VSCodeUtils.openNote(note!);
          const SIMPLE_SELECTION = new vscode.Selection(7, 0, 7, 12);
          editor.selection = SIMPLE_SELECTION;
          await new LookupCommand().execute({
            selectionType: "selection2link",
            noteType: LookupNoteTypeEnum.scratch,
            flavor: "note",
            noConfirm: true,
          });
          const scratchNote = getNoteFromTextEditor();
          expect(scratchNote.fname.startsWith("scratch")).toBeTruthy();
          done();
        },
      });
    });

    test("domainAsNamespace", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        configOverride: {
          "dendron.defaultScratchAddBehavior": "childOfDomainNamespace",
        },
        postSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD.create({
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          const {
            fname,
            selection,
          } = NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD;
          const editor = await getNoteFromFname({ fname, vault });
          editor.selection = new vscode.Selection(...selection);
          await new LookupCommand().execute({
            selectionType: "selection2link",
            noteType: LookupNoteTypeEnum.scratch,
            flavor: "note",
            noConfirm: true,
          });
          const scratchNote = getNoteFromTextEditor();
          expect(scratchNote.fname.startsWith("pro.scratch")).toBeTruthy();
          done();
        },
      });
    });
  });

  describe("multi", function () {
    test("basic, multi", function (done) {
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
          const notes = getWS().getEngine().notes;
          const note = NoteUtils.getNoteByFnameV5({
            fname,
            notes,
            vault,
            wsRoot: DendronWorkspace.wsRoot(),
          });
          const editor = await VSCodeUtils.openNote(note!);
          const SIMPLE_SELECTION = new vscode.Selection(7, 0, 7, 12);
          editor.selection = SIMPLE_SELECTION;
          await new LookupCommand().execute({
            selectionType: "selection2link",
            noteType: LookupNoteTypeEnum.scratch,
            flavor: "note",
            noConfirm: true,
          });
          const scratchNote = getNoteFromTextEditor();
          expect(scratchNote.fname.startsWith("scratch")).toBeTruthy();
          done();
        },
      });
    });

    test("domainAsNamespace", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        configOverride: {
          "dendron.defaultScratchAddBehavior": "childOfDomainNamespace",
        },
        postSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD.create({
            vault: vaults[1],
            wsRoot,
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[1];
          const {
            fname,
            selection,
          } = NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD;
          const editor = await getNoteFromFname({ fname, vault });
          editor.selection = new vscode.Selection(...selection);
          await new LookupCommand().execute({
            selectionType: "selection2link",
            noteType: LookupNoteTypeEnum.scratch,
            flavor: "note",
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
