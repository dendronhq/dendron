import { vault2Path } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import path from "path";
import * as vscode from "vscode";
import FrontmatterFoldingRangeProvider from "../../features/FrontmatterFoldingRangeProvider";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

async function provide(editor: vscode.TextEditor) {
  const doc = editor?.document as vscode.TextDocument;
  const provider = new FrontmatterFoldingRangeProvider();
  const foldingRanges = await provider.provideFoldingRanges(doc);
  return foldingRanges;
}

suite("FrontmatterFoldingRangeProvider", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ wsRoot, vaults }) => {
        const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
        const editor = await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(path.join(vaultDir, "foo.md"))
        );
        const foldingRange = (await provide(editor!)) as vscode.FoldingRange[];
        expect(foldingRange).toEqual([
          new vscode.FoldingRange(0, 6, vscode.FoldingRangeKind.Region),
        ]);
        done();
      },
    });
  });

  test("with horizontal line", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          body: [
            "Doloremque illo exercitationem error ab. Dicta architecto quis voluptatem. Numquam in est voluptatem quia impedit iusto repellendus magnam.",
            "",
            "---",
            "",
            "Aperiam in cupiditate temporibus id voluptas qui. Qui doloremque error odio eligendi quia. Quis ipsa aliquid voluptatem sunt.",
          ].join("\n"),
        });
      },
      onInit: async ({ wsRoot, vaults }) => {
        const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
        const editor = await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(path.join(vaultDir, "foo.md"))
        );
        const foldingRange = (await provide(editor!)) as vscode.FoldingRange[];
        expect(foldingRange).toEqual([
          new vscode.FoldingRange(0, 6, vscode.FoldingRangeKind.Region),
        ]);
        done();
      },
    });
  });
});
