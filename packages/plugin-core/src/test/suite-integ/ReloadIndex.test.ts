import { vault2Path } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("ReloadIndex", function () {
  // let root: DirResult;
  let ctx: vscode.ExtensionContext;
  // let vaultDir: string;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("re-create root files if missing", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
        const rootFiles = [
          path.join(vaultDir, "root.md"),
          path.join(vaultDir, "root.schema.yml"),
        ];
        rootFiles.map((ent) => fs.removeSync(ent));
        await new ReloadIndexCommand().run();
        expect(_.every(rootFiles.map((ent) => fs.existsSync(ent)))).toBeTruthy();
        done();
      },
    });
  });

  test("don't overwrite if root exists", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
        const rootFiles = [
          path.join(vaultDir, "root.md"),
          path.join(vaultDir, "root.schema.yml"),
        ];
        fs.appendFileSync(rootFiles[0], "bond", { encoding: "utf8" });
        fs.appendFileSync(rootFiles[1], "# bond", { encoding: "utf8" });
        await new ReloadIndexCommand().run();
        expect(_.every(
          rootFiles.map((ent) => fs.readFileSync(ent).indexOf("bond") >= 0)
        )).toBeTruthy();
        done();
      },
    });
  });
});
