import { afterEach, beforeEach } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronTreeViewV2 } from "../../views/DendronTreeViewV2";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { runMultiVaultTest, runSingleVaultTest } from "../testUtilsv2";

suite("TreeView, multi", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
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
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
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
