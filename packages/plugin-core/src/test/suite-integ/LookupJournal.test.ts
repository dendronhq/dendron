import { LookupNoteTypeEnum } from "@dendronhq/common-all";
import {
  NOTE_PRESETS_V4,
  runJestHarnessV2,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import * as vscode from "vscode";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { WSUtils } from "../../WSUtils";
import { expect, getNoteFromTextEditor } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("Journal Notes", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

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
          const engine = ExtensionProvider.getEngine();
          const note = (await engine.findNotesMeta({ fname, vault }))[0];
          await WSUtils.openNote(note!);
          await new NoteLookupCommand().run({
            noteType: LookupNoteTypeEnum.journal,
            noConfirm: true,
          });
          const newNote = getNoteFromTextEditor();
          expect(newNote.fname.startsWith(`${fname}.journal`)).toBeTruthy();
          // The note title should be in the format yyyy-MM-dd
          expect(/\d{4}-\d{2}-\d{2}$/g.test(newNote.title)).toBeTruthy();

          // TODO: traits isn't exposed in newNote props here because in the test
          //we extract noteProps via `getNoteFromTextEditor` instead of the
          //engine. So for now, test via the raw traitIds that should have been
          //added to the note.
          const traits = (newNote as any).traitIds;

          expect(
            traits.length === 1 && traits[0] === "journalNote"
          ).toBeTruthy();
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
          const engine = ExtensionProvider.getEngine();
          const note = (await engine.findNotesMeta({ fname, vault }))[0];
          await WSUtils.openNote(note!);
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
