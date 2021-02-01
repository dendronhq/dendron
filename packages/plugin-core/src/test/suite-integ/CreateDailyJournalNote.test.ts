import assert from "assert";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../../commands/CreateDailyJournal";
import { getActiveEditorBasename } from "../testUtils";
import { runSingleVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runSingleVaultTest({
      ctx,
      onInit: async ({}) => {
        await new CreateDailyJournalCommand().run();
        assert.ok(getActiveEditorBasename().startsWith("daily.journal"));
        done();
      },
    });
  });
});
