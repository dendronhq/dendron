import { vault2Path } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import path from "path";
import * as vscode from "vscode";
import FrontmatterFoldingRangeProvider from "../../features/FrontmatterFoldingRangeProvider";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacySingleWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

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
        expect(foldingRange).toEqual([new vscode.FoldingRange(0, 6)]);
        done();
      },
    });
  });
});
