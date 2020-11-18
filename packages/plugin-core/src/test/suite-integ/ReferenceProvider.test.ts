import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { NOTE_PRESETS } from "@dendronhq/common-test-utils";
import { afterEach, beforeEach } from "mocha";
import * as vscode from "vscode";
import ReferenceProvider from "../../features/ReferenceProvider";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { expect, runMultiVaultTest } from "../testUtilsv2";

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
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", (done) => {
    let noteWithTarget1: NotePropsV2;
    let noteWithTarget2: NotePropsV2;
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults }) => {
        noteWithTarget1 = await NOTE_PRESETS.NOTE_WITH_TARGET({
          fname: "alpha",
          vault: vaults[0],
        });
        noteWithTarget2 = await NOTE_PRESETS.NOTE_WITH_TARGET({
          fname: "beta",
          vault: vaults[0],
        });
      },
      onInit: async ({}) => {
        const editor = await VSCodeUtils.openNote(noteWithTarget1);
        const links = await provide(editor);
        expect(links.map((l) => l.uri.fsPath)).toEqual(
          [noteWithTarget1, noteWithTarget2].map((note) =>
            NoteUtilsV2.getPath({ note })
          )
        );
        done();
      },
    });
  });

  test("with multiple vaults", (done) => {
    let noteWithTarget1: NotePropsV2;
    let noteWithTarget2: NotePropsV2;
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults }) => {
        noteWithTarget1 = await NOTE_PRESETS.NOTE_WITH_TARGET({
          fname: "alpha",
          vault: vaults[0],
        });
        noteWithTarget2 = await NOTE_PRESETS.NOTE_WITH_TARGET({
          fname: "beta",
          vault: vaults[1],
        });
      },
      onInit: async ({}) => {
        const editor = await VSCodeUtils.openNote(noteWithTarget1);
        const links = await provide(editor);
        expect(links.map((l) => l.uri.fsPath)).toEqual(
          [noteWithTarget1, noteWithTarget2].map((note) =>
            NoteUtilsV2.getPath({ note })
          )
        );
        done();
      },
    });
  });

  test("with anchor", (done) => {
    let noteWithLink: NotePropsV2;

    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults }) => {
        await NOTE_PRESETS.NOTE_WITH_ANCHOR_TARGET({
          vault: vaults[0],
        });
        noteWithLink = await NOTE_PRESETS.NOTE_WITH_ANCHOR_LINK({
          vault: vaults[0],
        });
      },
      onInit: async ({}) => {
        const editor = await VSCodeUtils.openNote(noteWithLink);
        const links = await provide(editor);
        expect(links.map((l) => l.uri.fsPath)).toEqual(
          [noteWithLink].map((note) => NoteUtilsV2.getPath({ note }))
        );
        done();
      },
    });
  });

  test("with alias", (done) => {
    let noteWithLink: NotePropsV2;

    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults }) => {
        await NOTE_PRESETS.NOTE_WITH_TARGET({
          vault: vaults[0],
        });
        noteWithLink = await NOTE_PRESETS.NOTE_WITH_ALIAS_LINK({
          vault: vaults[0],
        });
      },
      onInit: async ({}) => {
        const editor = await VSCodeUtils.openNote(noteWithLink);
        const links = await provide(editor);
        expect(links.map((l) => l.uri.fsPath)).toEqual(
          [noteWithLink].map((note) => NoteUtilsV2.getPath({ note }))
        );
        done();
      },
    });
  });
});
