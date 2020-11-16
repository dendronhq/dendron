import { NodeTestUtilsV2, toPlainObject } from "@dendronhq/common-test-utils";
import assert from "assert";
import { afterEach, beforeEach } from "mocha";
import path from "path";
import * as vscode from "vscode";
import DocumentLinkProvider from "../../features/DocumentLinkProvider";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { runMultiVaultTest } from "../testUtilsv2";

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
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults }) => {
        const root = vaults[0];
        await NodeTestUtilsV2.createNote({
          vaultDir: root.fsPath,
          noteProps: { body: "[[foo]]", fname: "gamma" },
        });
      },
      onInit: async ({ vaults }) => {
        const notePath = path.join(vaults[0].fsPath, "gamma.md");
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
