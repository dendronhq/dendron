import * as vscode from "vscode";
import { RunMigrationCommand } from "../../commands/RunMigrationCommand";
// import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("RunMigrationCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ engine, wsRoot }) => {
        const cmd = new RunMigrationCommand();
        
        done();
      }
    })
  });
});