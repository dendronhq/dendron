import { getSlugger, NoteProps, NoteUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import {
  callSetupHook,
  ENGINE_HOOKS_MULTI,
  SETUP_HOOK_KEYS,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { before, describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { TextEditor } from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import DefinitionProvider from "../../features/DefinitionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getDWorkspace } from "../../workspace";
import { WSUtils } from "../../WSUtils";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { getActiveEditorBasename } from "../testUtils";
import { expect, LocationTestUtils } from "../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  stubCancellationToken,
} from "../testUtilsV3";

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
  describe("same vault", () => {
    let noteWithLink: NoteProps;
    let noteWithTarget: NoteProps;
    let _wsRoot: string;

    describeMultiWS(
      "",
      {
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
      },
      () => {
        test("THEN provide correct definitions", async () => {
          const editor = await WSUtils.openNote(noteWithTarget);
          const location = (await provide(editor)) as vscode.Location;
          expect(location.uri.fsPath.toLowerCase()).toEqual(
            NoteUtils.getFullPath({
              wsRoot: _wsRoot,
              note: noteWithLink,
            }).toLowerCase()
          );
        });
      }
    );

    describeMultiWS(
      "GIVEN vault prefix",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await callSetupHook(SETUP_HOOK_KEYS.WITH_LINKS, {
            workspaceType: "single",
            wsRoot,
            vaults,
            withVaultPrefix: true,
          });
        },
      },
      () => {
        test("THEN provide correct definitions", async () => {
          const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
          const note = engine.notes["alpha"];
          const beta = engine.notes["beta"];
          const editor = await WSUtils.openNote(note);
          const location = (await provide(editor)) as vscode.Location;
          expect(location.uri.fsPath.toLowerCase()).toEqual(
            NoteUtils.getFullPath({ wsRoot, note: beta }).toLowerCase()
          );
        });
      }
    );

    describeMultiWS(
      "GIVEN anchor",
      {
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
      },
      () => {
        test("THEN provide correct definitions", async () => {
          const { engine } = ExtensionProvider.getDWorkspace();
          const note = engine.notes["beta"];
          const editor = await WSUtils.openNote(note);
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
        });
      }
    );

    describeMultiWS(
      "GIVEN alias",
      {
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
      },
      () => {
        test("THEN provide correct definitions", async () => {
          const editor = await WSUtils.openNote(noteWithLink);
          const location = (await provide(editor)) as vscode.Location;
          expect(location.uri.fsPath.toLowerCase()).toEqual(
            NoteUtils.getFullPath({
              wsRoot: _wsRoot,
              note: noteWithTarget,
            }).toLowerCase()
          );
        });
      }
    );

    const { ANCHOR_WITH_SPECIAL_CHARS } = GOTO_NOTE_PRESETS;
    describeMultiWS(
      "GIVEN anchor with special characters",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          const { specialCharsHeader } =
            await ANCHOR_WITH_SPECIAL_CHARS.preSetupHook({
              wsRoot,
              vaults: [vault],
            });
          await NoteTestUtilsV4.createNote({
            fname: "beta",
            vault,
            body: `[[alpha#${getSlugger().slug(specialCharsHeader)}]]`,
            wsRoot,
          });
        },
      },
      () => {
        test("THEN provide correct definitions", async () => {
          const { engine } = ExtensionProvider.getDWorkspace();
          const note = engine.notes["beta"];
          const editor = await WSUtils.openNote(note);
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
        });
      }
    );
  });

  describeMultiWS(
    "GIVEN multi vault",
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await ENGINE_HOOKS_MULTI.setupLinksMulti({ wsRoot, vaults });
      },
    },
    () => {
      test("THEN provide correct definitions", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const note = engine.notes["alpha"];
        const editor = await WSUtils.openNote(note);

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
      });
    }
  );
  describeMultiWS(
    "GIVEN multi vault with prefix",
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await callSetupHook(SETUP_HOOK_KEYS.WITH_LINKS, {
          workspaceType: "multi",
          wsRoot,
          vaults,
          withVaultPrefix: true,
        });
      },
    },
    () => {
      test("THEN provide correct definitions", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const note = engine.notes["alpha"];
        const editor = await WSUtils.openNote(note);

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
      });
    }
  );

  let noteTarget1: NoteProps;
  let noteTarget2: NoteProps;
  let noteWithLink: NoteProps;

  describeMultiWS(
    "GIVEN multi vault with same name",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
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
    },
    () => {
      test("THEN provide correct definitions", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const editor = await WSUtils.openNote(noteWithLink);
        const locations = (await provide(editor)) as vscode.Location[];
        expect(locations.length).toEqual(2);
        expect(locations.map((l) => l.uri.fsPath.toLowerCase())).toEqual([
          NoteUtils.getFullPath({
            wsRoot,
            note: noteTarget1,
          }).toLowerCase(),
          NoteUtils.getFullPath({
            wsRoot,
            note: noteTarget2,
          }).toLowerCase(),
        ]);
      });
    }
  );

  describeMultiWS(
    "GIVEN notes with same name",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
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
    },
    () => {
      test("THEN provide correct definitions", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const editor = await WSUtils.openNote(noteWithLink);
        const locations = (await provide(editor)) as vscode.Location[];
        expect(locations.length).toEqual(2);
        expect(locations.map((l) => l.uri.fsPath.toLowerCase())).toEqual([
          NoteUtils.getFullPath({
            wsRoot,
            note: noteTarget1,
          }).toLowerCase(),
          NoteUtils.getFullPath({
            wsRoot,
            note: noteTarget2,
          }).toLowerCase(),
        ]);
      });
    }
  );

  describeSingleWS("WHEN used on a link to a non-note file", {}, () => {
    before(async () => {
      const { wsRoot } = getDWorkspace();
      await fs.writeFile(
        path.join(wsRoot, "test.txt"),
        "Et voluptatem autem sunt."
      );
    });

    test("THEN opens the non-note file", async () => {
      const { vaults, wsRoot, engine } = getDWorkspace();
      const note = await NoteTestUtilsV4.createNoteWithEngine({
        wsRoot,
        vault: vaults[0],
        fname: "test.note",
        body: "[[/test.txt]]",
        engine,
      });

      await WSUtils.openNote(note);
      VSCodeUtils.getActiveTextEditorOrThrow().selection = new vscode.Selection(
        7,
        1,
        7,
        1
      );
      const { document } = VSCodeUtils.getActiveTextEditorOrThrow();
      const pos = LocationTestUtils.getPresetWikiLinkPosition();
      await new DefinitionProvider().provideDefinition(
        document,
        pos,
        stubCancellationToken()
      );
      expect(getActiveEditorBasename()).toEqual("test.txt");
      expect(
        VSCodeUtils.getActiveTextEditorOrThrow().document.getText().trim()
      ).toEqual("Et voluptatem autem sunt.");
    });
  });
});
