import { NoteUtils } from "@dendronhq/common-all";
import {
  NOTE_PRESETS_V4,
  runJestHarnessV2,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import * as vscode from "vscode";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import { LookupNoteTypeEnum } from "../../components/lookup/types";
import { VSCodeUtils } from "../../utils";
import { getWSV2 } from "../../workspace";
import { expect, getNoteFromTextEditor } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("Scratch Notes", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

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
          const notes = getWSV2().engine.notes;
          const note = NoteUtils.getNoteByFnameV5({
            fname,
            notes,
            vault,
            wsRoot: getWSV2().wsRoot,
          });
          await VSCodeUtils.openNote(note!);
          await new NoteLookupCommand().run({
            noteType: LookupNoteTypeEnum.journal,
            noConfirm: true,
          });
          const newNote = getNoteFromTextEditor();
          expect(newNote.fname.startsWith(`${fname}.journal`)).toBeTruthy();
          done();
        },
      });
    });

    test("basic, with template", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS_MULTI.setupSchemaPresetWithNamespaceTemplateMulti({
            wsRoot,
            vaults,
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[1];
          const fname = "daily";
          const notes = getWSV2().engine.notes;
          const note = NoteUtils.getNoteByFnameV5({
            fname,
            notes,
            vault,
            wsRoot: getWSV2().wsRoot,
          });
          await VSCodeUtils.openNote(note!);
          await new NoteLookupCommand().run({
            noteType: LookupNoteTypeEnum.journal,
            noConfirm: true,
          });
          const newNote = getNoteFromTextEditor();
          expect(newNote.fname.startsWith(`${fname}.journal`)).toBeTruthy();
          await runJestHarnessV2(
            [
              {
                actual: _.trim(newNote.body),
                expected: "Template text",
              },
            ],
            expect
          );
          done();
        },
      });
    });

    // test("domainAsNamespace", function (done) {
    //   runLegacyMultiWorkspaceTest({
    //     ctx,
    //     configOverride: {
    //       "dendron.defaultScratchAddBehavior": "childOfDomainNamespace",
    //     },
    //     postSetupHook: async ({ wsRoot, vaults }) => {
    //       await NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD.create({
    //         vault: vaults[1],
    //         wsRoot,
    //       });
    //     },
    //     onInit: async ({ vaults }) => {
    //       const vault = vaults[1];
    //       const {
    //         fname,
    //         selection,
    //       } = NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD;
    //       const editor = await getNoteFromFname({ fname, vault });
    //       editor.selection = new vscode.Selection(...selection);
    //       await new LookupCommand().execute({
    //         selectionType: "selection2link",
    //         noteType: "scratch",
    //         flavor: "note",
    //         noConfirm: true,
    //       });
    //       const scratchNote = getNoteFromTextEditor();
    //       expect(scratchNote.fname.startsWith("pro.scratch")).toBeTruthy();
    //       done();
    //     },
    //   });
    // });
  });
});
