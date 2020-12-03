// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { DendronTreeViewV2 } from "../../views/DendronTreeViewV2";
import { runMultiVaultTest, runSingleVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("TreeView, multi", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", function (done) {
    DendronTreeViewV2.register(ctx);
    runMultiVaultTest({
      ctx,
      onInit: async () => {
        done();
      },
    });
  });
});

suite("TreeView, single ", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", function (done) {
    DendronTreeViewV2.register(ctx);
    runSingleVaultTest({
      ctx,
      onInit: async () => {
        done();
      },
    });
  });
});
