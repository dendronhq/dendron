import { vault2Path } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { runLegacyMultiWorkspaceTest } from "../testUtilsV3";

suite("ReloadIndex", function () {
  // let root: DirResult;
  let ctx: vscode.ExtensionContext;
  // let vaultDir: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    // root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
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
        assert.ok(_.every(rootFiles.map((ent) => fs.existsSync(ent))));
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
        assert.ok(
          _.every(
            rootFiles.map((ent) => fs.readFileSync(ent).indexOf("bond") >= 0)
          )
        );
        done();
      },
    });
  });
});
