import { NoteTestUtilsV4, toPlainObject } from "@dendronhq/common-test-utils";
import assert from "assert";
import path from "path";
import * as vscode from "vscode";
import DocumentLinkProvider from "../../features/DocumentLinkProvider";
import { VSCodeUtils } from "../../utils";
import { runMultiVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("DocumentLinkProvider", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", (done) => {
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "gamma",
          body: "[[foo]]",
        });
      },
      onInit: async ({ wsRoot, vaults }) => {
        const notePath = path.join(wsRoot, vaults[0].fsPath, "gamma.md");
        const editor = await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(notePath)
        );
        const doc = editor?.document as vscode.TextDocument;
        const linkProvider = new DocumentLinkProvider();
        const links = linkProvider.provideDocumentLinks(doc);

        assert.strictEqual(links.length, 1);
        console.log(toPlainObject(links[0]));
        done();
      },
    });
  });
});
