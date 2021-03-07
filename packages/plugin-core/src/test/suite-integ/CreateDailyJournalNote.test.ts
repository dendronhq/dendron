import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../../commands/CreateDailyJournal";
import { getActiveEditorBasename } from "../testUtils";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runSingleVaultTest({
      ctx,
      onInit: async ({}) => {
        await new CreateDailyJournalCommand().run();
        expect(getActiveEditorBasename().startsWith("daily.journal")).toBeTruthy();
        done();
      },
    });
  });
});
