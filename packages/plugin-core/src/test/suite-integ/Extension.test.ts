import { WorkspaceUtilsCommon } from "@dendronhq/common-all";
import { GitUtils, tmpDir } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import fs from "fs-extra";
import { describe, it } from "mocha";
import path from "path";
import vscode, { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import {
  InitializeType,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import {
  DEFAULT_LEGACY_VAULT_NAME,
  DENDRON_COMMANDS,
  GLOBAL_STATE,
} from "../../constants";
import { getWS } from "../../workspace";
import { _activate } from "../../_extension";
import {
  expect,
  genEmptyWSFiles,
  genTutorialWSFiles,
  resetCodeWorkspace,
  stubWorkspaceFile,
} from "../testUtilsv2";
import {
  DENDRON_REMOTE_VAULT,
  setupBeforeAfter,
  stubSetupWorkspace,
  writeConfig,
} from "../testUtilsV3";

suite("Extension", function () {
  let ctx: ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: async () => {
      await resetCodeWorkspace();
      await new ResetConfigCommand().execute({ scope: "all" });
    },
  });

  describe("setup workspace", function () {
    it("not active", function (done) {
      _activate(ctx).then((resp) => {
        expect(resp).toBeFalsy();
        done();
      });
    });

    it.skip("not active/ init, first time", function (done) {
      const wsRoot = tmpDir().name;
      _activate(ctx).then(async (resp) => {
        expect(resp).toBeFalsy();
        stubSetupWorkspace({ wsRoot, initType: InitializeType.EMPTY });
        await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS.key, {
          skipOpenWs: true,
          skipConfirmation: true,
        } as SetupWorkspaceOpts);

        // first time init
        expect(
          fs.readdirSync(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
        ).toEqual(genTutorialWSFiles());
        done();
      });
    });

    it("not active/ init, not first time", function (done) {
      const wsRoot = tmpDir().name;
      getWS()
        .context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, false)
        .then(() => {
          _activate(ctx).then(async (resp) => {
            expect(resp).toBeFalsy();
            stubSetupWorkspace({ wsRoot, initType: InitializeType.EMPTY });
            await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS.key, {
              skipOpenWs: true,
              skipConfirmation: true,
            } as SetupWorkspaceOpts);

            // first time init
            expect(
              fs.readdirSync(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
            ).toEqual(genEmptyWSFiles());
            done();
          });
        });
    });

    it("active, remote vaults present", function (done) {
      const wsRoot = tmpDir().name;
      getWS()
        .context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, false)
        .then(() => {
          stubWorkspaceFile(wsRoot);
          // add remote vault
          const config = DConfig.getOrCreate(wsRoot);
          config.vaults.push(DENDRON_REMOTE_VAULT);
          writeConfig({ config, wsRoot });
          _activate(ctx).then(async () => {
            const rVaultPath = WorkspaceUtilsCommon.getPathForVault({
              vault: DENDRON_REMOTE_VAULT,
              wsRoot,
            });
            expect(GitUtils.isRepo(rVaultPath)).toBeTruthy();
            done();
          });
        });
    });
  });

  describe.skip("setup workspace v2", function () {
    it("not active/ init", function (done) {
      const wsRoot = tmpDir().name;
      _activate(ctx).then(async (resp) => {
        expect(resp).toBeFalsy();
        stubSetupWorkspace({ wsRoot, initType: InitializeType.EMPTY });
        await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS_V2.key, {
          skipOpenWs: true,
          skipConfirmation: true,
        } as SetupWorkspaceOpts);
        expect(fs.readdirSync(wsRoot)).toEqual([
          "dendron",
          "docs",
          "vault-main",
        ]);
        done();
      });
    });
  });
});
