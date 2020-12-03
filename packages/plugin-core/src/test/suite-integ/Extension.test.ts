import { tmpDir } from "@dendronhq/common-server";
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
} from "../testUtilsv2";
import { setupBeforeAfter, stubSetupWorkspace } from "../testUtilsV3";

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

    it("not active/ init, first time", function (done) {
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
