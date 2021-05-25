import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../../commands/CreateDailyJournal";
import { getActiveEditorBasename } from "../testUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("CreateDailyJournal", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({}) => {
        await new CreateDailyJournalCommand().run();
        expect(
          getActiveEditorBasename().startsWith("daily.journal")
        ).toBeTruthy();
        done();
      },
    });
  });
});
