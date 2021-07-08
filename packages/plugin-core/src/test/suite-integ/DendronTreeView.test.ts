// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { DendronTreeView } from "../../views/DendronTreeView";
import { runMultiVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("TreeView, multi", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", (done) => {
    DendronTreeView.register(ctx);
    runMultiVaultTest({
      ctx,
      onInit: async () => {
        done();
      },
    });
  });
});
