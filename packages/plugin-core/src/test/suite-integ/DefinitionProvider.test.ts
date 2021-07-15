import { getSlugger, NoteProps, NoteUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import {
  callSetupHook,
  ENGINE_HOOKS_MULTI,
  SETUP_HOOK_KEYS,
} from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { TextEditor } from "vscode";
import DefinitionProvider from "../../features/DefinitionProvider";
import { VSCodeUtils } from "../../utils";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { expect, LocationTestUtils } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

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

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("same vault", () => {
    let noteWithLink: NoteProps;
    let noteWithTarget: NoteProps;
    let _wsRoot: string;

    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          _wsRoot = wsRoot;
          noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            wsRoot,
            vault: vaults[0],
            genRandomId: true,
          });
          noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(noteWithTarget);
          const location = (await provide(editor)) as vscode.Location;
          expect(location.uri.fsPath.toLowerCase()).toEqual(
            NoteUtils.getFullPath({ wsRoot: _wsRoot, note: noteWithLink }).toLowerCase()
          );
          done();
        },
      });
    });

    test("basic with vault prefix", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ engine, wsRoot }) => {
          const note = engine.notes["alpha"];
          const beta = engine.notes["beta"];
          const editor = await VSCodeUtils.openNote(note);
          const location = (await provide(editor)) as vscode.Location;
          expect(location.uri.fsPath.toLowerCase()).toEqual(
            NoteUtils.getFullPath({ wsRoot, note: beta }).toLowerCase()
          );
          done();
        },
        preSetupHook: async ({ wsRoot, vaults }) => {
          await callSetupHook(SETUP_HOOK_KEYS.WITH_LINKS, {
            workspaceType: "single",
            wsRoot,
            vaults,
            withVaultPrefix: true,
          });
        },
      });
    });

    test("with anchor", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          await GOTO_NOTE_PRESETS.ANCHOR.preSetupHook({ wsRoot, vaults });
          await NoteTestUtilsV4.createNote({
            fname: "beta",
            vault,
            body: `[[alpha#h3]]`,
            wsRoot,
          });
        },
        onInit: async ({ engine }) => {
          const note = engine.notes["beta"];
          const editor = await VSCodeUtils.openNote(note);
          const doc = editor?.document as vscode.TextDocument;
          const provider = new DefinitionProvider();
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const loc = (await provider.provideDefinition(
            doc,
            pos,
            null as any
          )) as vscode.Location;
          expect(LocationTestUtils.getBasenameFromLocation(loc)).toEqual(
            "alpha.md"
          );
          done();
        },
      });
    });

    test("with alias", (done) => {
      let noteWithLink: NoteProps;
      let _wsRoot: string;

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          _wsRoot = wsRoot;
          noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
          noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_ALIAS_LINK.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(noteWithLink);
          const location = (await provide(editor)) as vscode.Location;
          expect(location.uri.fsPath.toLowerCase()).toEqual(
            NoteUtils.getFullPath({ wsRoot: _wsRoot, note: noteWithTarget }).toLowerCase()
          );
          done();
        },
      });
    });

    const { ANCHOR_WITH_SPECIAL_CHARS } = GOTO_NOTE_PRESETS;
    test("anchor with special chars", (done) => {
      let specialCharsHeader: string;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          ({ specialCharsHeader } =
            await ANCHOR_WITH_SPECIAL_CHARS.preSetupHook({
              wsRoot,
              vaults: [vault],
            }));
          await NoteTestUtilsV4.createNote({
            fname: "beta",
            vault,
            body: `[[alpha#${getSlugger().slug(specialCharsHeader)}]]`,
            wsRoot,
          });
        },
        onInit: async ({ engine }) => {
          const note = engine.notes["beta"];
          const editor = await VSCodeUtils.openNote(note);
          const doc = editor?.document as vscode.TextDocument;
          const provider = new DefinitionProvider();
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const loc = (await provider.provideDefinition(
            doc,
            pos,
            null as any
          )) as vscode.Location;
          expect(LocationTestUtils.getBasenameFromLocation(loc)).toEqual(
            "alpha.md"
          );
          done();
        },
      });
    });
  });

  describe("multi vault", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await ENGINE_HOOKS_MULTI.setupLinksMulti({ wsRoot, vaults });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const note = engine.notes["alpha"];
          const editor = await VSCodeUtils.openNote(note);

          const doc = editor?.document as vscode.TextDocument;
          const provider = new DefinitionProvider();
          const locations = (await provider.provideDefinition(
            doc,
            LocationTestUtils.getPresetWikiLinkPosition(),
            null as any
          )) as vscode.Location;
          expect(locations.uri.fsPath.toLowerCase()).toEqual(
            path.join(wsRoot, vaults[1].fsPath, "beta.md").toLowerCase()
          );
          done();
        },
      });
    });

    test("basic with vault prefix", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await callSetupHook(SETUP_HOOK_KEYS.WITH_LINKS, {
            workspaceType: "multi",
            wsRoot,
            vaults,
            withVaultPrefix: true,
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const note = engine.notes["alpha"];
          const editor = await VSCodeUtils.openNote(note);

          const doc = editor?.document as vscode.TextDocument;
          const provider = new DefinitionProvider();
          const locations = (await provider.provideDefinition(
            doc,
            LocationTestUtils.getPresetWikiLinkPosition(),
            null as any
          )) as vscode.Location;
          expect(locations.uri.fsPath.toLowerCase()).toEqual(
            path.join(wsRoot, vaults[1].fsPath, "beta.md").toLowerCase()
          );
          done();
        },
      });
    });

    test("with same name", (done) => {
      let noteWithLink: NoteProps;
      let noteTarget1: NoteProps;
      let noteTarget2: NoteProps;
      let _wsRoot: string;

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          _wsRoot = wsRoot;
          noteTarget1 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            wsRoot,
            vault: vaults[0],
            genRandomId: true,
          });
          noteTarget2 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            wsRoot,
            vault: vaults[1],
            genRandomId: true,
          });
          noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(noteWithLink);
          const locations = (await provide(editor)) as vscode.Location[];
          expect(locations.length).toEqual(2);
          expect(locations.map((l) => l.uri.fsPath.toLowerCase())).toEqual([
            NoteUtils.getFullPath({ wsRoot: _wsRoot, note: noteTarget1 }).toLowerCase(),
            NoteUtils.getFullPath({ wsRoot: _wsRoot, note: noteTarget2 }).toLowerCase(),
          ]);
          done();
        },
      });
    });

    test("with anchor", (done) => {
      let noteWithTarget: NoteProps;
      let noteWithLink: NoteProps;
      let _wsRoot: string;

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          _wsRoot = wsRoot;
          noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create(
            {
              wsRoot,
              vault: vaults[0],
            }
          );
          noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
            wsRoot,
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
          expect(loc.uri.fsPath.toLowerCase()).toEqual(
            NoteUtils.getFullPath({ wsRoot: _wsRoot, note: noteWithTarget }).toLowerCase()
          );
          done();
        },
      });
    });

    test("with hashtag", (done) => {
      let noteWithTarget: NoteProps;
      let noteWithLink: NoteProps;
      let _wsRoot: string;

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          _wsRoot = wsRoot;
          noteWithTarget = await NoteTestUtilsV4.createNote({
            fname: "tags.my-test.note0",
            vault: vaults[0],
            wsRoot,
          });
          noteWithLink = await NoteTestUtilsV4.createNote({
            fname: "test-note",
            vault: vaults[0],
            body: "#my-test.note0",
            wsRoot,
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
          expect(loc.uri.fsPath).toEqual(
            NoteUtils.getFullPath({ wsRoot: _wsRoot, note: noteWithTarget })
          );
          done();
        },
      });
    });
  });
});
