import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import {
  NoteTestUtilsV3,
  NOTE_PRESETS,
  runMochaHarness,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { TextEditor } from "vscode";
import DefinitionProvider from "../../features/DefinitionProvider";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { getSlugger } from "../../utils/strings";
import { DendronWorkspace } from "../../workspace";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { LINKS_PRESETS } from "../presets/LinkPresets";
import { TIMEOUT } from "../testUtils";
import { expect, LocationTestUtils, runMultiVaultTest } from "../testUtilsv2";

const { NOTES_DIFF_VAULT } = LINKS_PRESETS;

async function provide(editor: TextEditor) {
  const doc = editor?.document as vscode.TextDocument;
  const provider = new DefinitionProvider();
  const locations = await provider.provideDefinition(
    doc,
    LocationTestUtils.getPresetWikiLinkPosition(),
    null as any
  );
  return locations;
}

suite("DefinitionProvider", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  describe("same vault", function () {
    let noteWithLink: NotePropsV2;
    let noteWithTarget: NotePropsV2;

    test("basic", (done) => {
      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ vaults }) => {
          noteWithTarget = await NOTE_PRESETS.NOTE_WITH_TARGET({
            vault: vaults[0],
            genRandomId: true,
          });
          noteWithLink = await NOTE_PRESETS.NOTE_WITH_LINK({
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(noteWithTarget);
          const location = (await provide(editor)) as vscode.Location;
          expect(location.uri.fsPath).toEqual(
            NoteUtilsV2.getPath({ note: noteWithLink })
          );
          done();
        },
      });
    });

    test("with anchor", (done) => {
      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          await GOTO_NOTE_PRESETS.ANCHOR.preSetupHook({ wsRoot, vaults });
          await NoteTestUtilsV3.createNote({
            fname: "beta",
            vault,
            body: `[[alpha#h3]]`,
          });
        },
        onInit: async ({ vaults }) => {
          const notePath = path.join(vaults[0].fsPath, "beta.md");
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          const doc = editor?.document as vscode.TextDocument;
          const provider = new DefinitionProvider();
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const loc = (await provider.provideDefinition(
            doc,
            pos,
            null as any
          )) as vscode.Location;
          assert.strictEqual(
            LocationTestUtils.getBasenameFromLocation(loc),
            "alpha.md"
          );
          await runMochaHarness(GOTO_NOTE_PRESETS.ANCHOR.results);
          done();
        },
      });
    });

    test("with alias", (done) => {
      let noteWithTarget: NotePropsV2;
      let noteWithLink: NotePropsV2;

      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ vaults }) => {
          noteWithTarget = await NOTE_PRESETS.NOTE_WITH_TARGET({
            vault: vaults[0],
          });
          noteWithLink = await NOTE_PRESETS.NOTE_WITH_ALIAS_LINK({
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(noteWithLink);
          const location = (await provide(editor)) as vscode.Location;
          expect(location.uri.fsPath).toEqual(
            NoteUtilsV2.getPath({ note: noteWithTarget })
          );
          done();
        },
      });
    });

    const { ANCHOR_WITH_SPECIAL_CHARS } = GOTO_NOTE_PRESETS;
    test("anchor with special chars", (done) => {
      let specialCharsHeader: string;
      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          ({
            specialCharsHeader,
          } = await ANCHOR_WITH_SPECIAL_CHARS.preSetupHook({
            wsRoot,
            vaults: [vault],
          }));
          await NoteTestUtilsV3.createNote({
            fname: "beta",
            vault,
            body: `[[alpha#${getSlugger().slug(specialCharsHeader)}]]`,
          });
        },
        onInit: async ({ vaults }) => {
          const notePath = path.join(vaults[0].fsPath, "beta.md");
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          const doc = editor?.document as vscode.TextDocument;
          const provider = new DefinitionProvider();
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const loc = (await provider.provideDefinition(
            doc,
            pos,
            null as any
          )) as vscode.Location;
          assert.strictEqual(
            LocationTestUtils.getBasenameFromLocation(loc),
            "alpha.md"
          );
          await runMochaHarness(ANCHOR_WITH_SPECIAL_CHARS.results);
          done();
        },
      });
    });
  });

  describe("multi vault", function () {
    test("basic", (done) => {
      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NOTES_DIFF_VAULT.preSetupHook({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const editor = await VSCodeUtils.openNoteByPath({
            vault: vaults[0],
            fname: "alpha",
          });
          const doc = editor?.document as vscode.TextDocument;
          const provider = new DefinitionProvider();
          const locations = (await provider.provideDefinition(
            doc,
            LocationTestUtils.getPresetWikiLinkPosition(),
            null as any
          )) as vscode.Location;
          assert.strictEqual(
            locations.uri.fsPath,
            path.join(vaults[1].fsPath, "beta.md")
          );
          done();
        },
      });
    });

    test("with same name", function (done) {
      let noteWithLink: NotePropsV2;
      let noteTarget1: NotePropsV2;
      let noteTarget2: NotePropsV2;

      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ vaults }) => {
          noteTarget1 = await NOTE_PRESETS.NOTE_WITH_TARGET({
            vault: vaults[0],
            genRandomId: true,
          });
          noteTarget2 = await NOTE_PRESETS.NOTE_WITH_TARGET({
            vault: vaults[1],
            genRandomId: true,
          });
          noteWithLink = await NOTE_PRESETS.NOTE_WITH_LINK({
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(noteWithLink);
          const locations = (await provide(editor)) as vscode.Location[];
          assert.deepStrictEqual(locations.length, 2);
          assert.deepStrictEqual(
            locations.map((l) => l.uri.fsPath),
            [
              NoteUtilsV2.getPath({ note: noteTarget1 }),
              NoteUtilsV2.getPath({ note: noteTarget2 }),
            ]
          );
          done();
        },
      });
    });

    test("with anchor", (done) => {
      let noteWithTarget: NotePropsV2;
      let noteWithLink: NotePropsV2;

      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ vaults }) => {
          noteWithTarget = await NOTE_PRESETS.NOTE_WITH_ANCHOR_TARGET({
            vault: vaults[0],
          });
          noteWithLink = await NOTE_PRESETS.NOTE_WITH_ANCHOR_LINK({
            vault: vaults[1],
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(noteWithLink);
          const doc = editor?.document as vscode.TextDocument;
          const provider = new DefinitionProvider();
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const loc = (await provider.provideDefinition(
            doc,
            pos,
            null as any
          )) as vscode.Location;
          assert.strictEqual(
            loc.uri.fsPath,
            NoteUtilsV2.getPath({ note: noteWithTarget })
          );
          await runMochaHarness(GOTO_NOTE_PRESETS.ANCHOR.results);
          done();
        },
      });
    });
  });
});
