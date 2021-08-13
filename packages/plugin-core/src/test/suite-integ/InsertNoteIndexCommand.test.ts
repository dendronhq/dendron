import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { InsertNoteIndexCommand } from "../../commands/InsertNoteIndexCommand";
import { TIMEOUT } from "../testUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("InsertNoteIndex", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this);
  this.timeout(TIMEOUT);

  describe("basic", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async () => {
          const cmd = new InsertNoteIndexCommand();
          await cmd.execute({});
          expect(undefined).toBeFalsy();
          done();
        }
      })
    });
  });
});
