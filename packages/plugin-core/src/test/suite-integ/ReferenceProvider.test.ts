import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import * as vscode from "vscode";
import ReferenceProvider from "../../features/ReferenceProvider";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

async function provide(editor: vscode.TextEditor) {
  const doc = editor?.document as vscode.TextDocument;
  const referenceProvider = new ReferenceProvider();
  const links = await referenceProvider.provideReferences(
    doc,
    new vscode.Position(7, 2)
  );
  return links;
}

suite("DocumentLinkProvider", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", (done) => {
    let noteWithTarget1: NoteProps;
    let noteWithTarget2: NoteProps;
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithTarget1 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          fname: "alpha",
          vault: vaults[0],
          wsRoot,
        });
        noteWithTarget2 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          fname: "beta",
          vault: vaults[0],
          wsRoot,
        });
      },
      onInit: async ({}) => {
        const editor = await VSCodeUtils.openNote(noteWithTarget1);
        const links = await provide(editor);
        expect(links.map((l) => l.uri.fsPath)).toEqual(
          [noteWithTarget1, noteWithTarget2].map((note) =>
            NoteUtils.getPathV4({ note, wsRoot: DendronWorkspace.wsRoot() })
          )
        );
        done();
      },
    });
  });

  test("with multiple vaults", (done) => {
    let noteWithTarget1: NoteProps;
    let noteWithTarget2: NoteProps;
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithTarget1 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          fname: "alpha",
          vault: vaults[0],
          wsRoot,
        });
        noteWithTarget2 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          fname: "beta",
          vault: vaults[1],
          wsRoot,
        });
      },
      onInit: async ({}) => {
        const editor = await VSCodeUtils.openNote(noteWithTarget1);
        const links = await provide(editor);
        expect(links.map((l) => l.uri.fsPath)).toEqual(
          [noteWithTarget1, noteWithTarget2].map((note) =>
            NoteUtils.getPathV4({ note, wsRoot: DendronWorkspace.wsRoot() })
          )
        );
        done();
      },
    });
  });

  test("with anchor", (done) => {
    let noteWithLink: NoteProps;

    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
          vault: vaults[0],
          wsRoot,
        });
        noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
          vault: vaults[0],
          wsRoot,
        });
      },
      onInit: async ({}) => {
        const editor = await VSCodeUtils.openNote(noteWithLink);
        const links = await provide(editor);
        expect(links.map((l) => l.uri.fsPath)).toEqual(
          [noteWithLink].map((note) =>
            NoteUtils.getPathV4({ note, wsRoot: DendronWorkspace.wsRoot() })
          )
        );
        done();
      },
    });
  });

  test("with alias", (done) => {
    let noteWithLink: NoteProps;

    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          vault: vaults[0],
          wsRoot,
        });
        noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_ALIAS_LINK.create({
          vault: vaults[0],

          wsRoot,
        });
      },
      onInit: async ({}) => {
        const editor = await VSCodeUtils.openNote(noteWithLink);
        const links = await provide(editor);
        expect(links.map((l) => l.uri.fsPath)).toEqual(
          [noteWithLink].map((note) =>
            NoteUtils.getPathV4({ note, wsRoot: DendronWorkspace.wsRoot() })
          )
        );
        done();
      },
    });
  });
});
