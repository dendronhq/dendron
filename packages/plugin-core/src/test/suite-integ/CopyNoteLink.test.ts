import { NotePropsV2 } from "@dendronhq/common-all";
import { DirResult, tmpDir } from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteLinkCommand } from "../../commands/CopyNoteLink";
import { VSCodeUtils } from "../../utils";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";
import { expect, LocationTestUtils, runMultiVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  this.timeout(TIMEOUT);

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const link = await new CopyNoteLinkCommand().run();
      assert.strictEqual(link, "[[Foo|foo]]");
      console.log("asndoasndo");
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  test("with anchor", function (done) {
    let noteWithTarget: NotePropsV2;

    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
      onInit: async () => {
        const editor = await VSCodeUtils.openNote(noteWithTarget);
        const pos = LocationTestUtils.getPresetWikiLinkPosition();
        const pos2 = LocationTestUtils.getPresetWikiLinkPosition({ char: 12 });
        editor.selection = new vscode.Selection(pos, pos2);
        const link = await new CopyNoteLinkCommand().run();
        expect(link).toEqual(`[[Alpha|${noteWithTarget.fname}#h1]]`);
        editor.selection = new vscode.Selection(
          LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
          LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
        );
        const link2 = await new CopyNoteLinkCommand().run();
        expect(link2).toEqual(`[[Alpha|${noteWithTarget.fname}#h2-8a]]`);
        done();
      },
    });
  });
});
