import assert from "assert";
import { afterEach, beforeEach } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../../commands/CreateDailyJournal";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { getActiveEditorBasename, TIMEOUT } from "../testUtils";
import { runSingleVaultTest } from "../testUtilsv2";

suite("notes", function () {
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
    runSingleVaultTest({
      ctx,
      onInit: async ({}) => {
        await new CreateDailyJournalCommand().run();
        assert.ok(getActiveEditorBasename().startsWith("daily"));
        done();
      },
    });
  });
});
