import { readYAML, tmpDir } from "@dendronhq/common-server";
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

    it("not active, initial create ws", function (done) {
      const wsRoot = tmpDir().name;
      getWS()
        .context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, true)
        .then(() => {
          _activate(ctx).then(async () => {
            stubSetupWorkspace({
              wsRoot,
              initType: InitializeType.TUTORIAL_NOTES,
            });
            await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS.key, {
              skipOpenWs: true,
              skipConfirmation: true,
            } as SetupWorkspaceOpts);
            const resp = readYAML(path.join(wsRoot, "dendron.yml"));
            expect(resp).toEqual({
              version: 1,
              vaults: [
                {
                  fsPath: "vault",
                },
              ],
              useFMTitle: true,
              initializeRemoteVaults: true,
              noLegacyNoteRef: true,
              site: {
                copyAssets: true,
                siteHierarchies: ["root"],
                siteRootDir: "docs",
                usePrettyRefs: true,
                title: "Dendron",
                description: "Personal knowledge space",
                duplicateNoteBehavior: {
                  action: "useVault",
                  payload: ["vault"],
                },
              },
            });
            expect(
              fs.readdirSync(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
            ).toEqual(genTutorialWSFiles());
            done();
          });
        });
    });

    it("not active, not initial create ws", function (done) {
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

    // TODO: stub the vauls
    // it("active, remote vaults present", function (done) {
    //   const wsRoot = tmpDir().name;
    //   getWS()
    //     .context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, false)
    //     .then(() => {
    //       stubWorkspaceFile(wsRoot);
    //       // add remote vault
    //       const config = DConfig.getOrCreate(wsRoot);
    //       config.vaults.push(DENDRON_REMOTE_VAULT);
    //       writeConfig({ config, wsRoot });
    //       _activate(ctx).then(async () => {
    //         const rVaultPath = vault2Path({
    //           vault: DENDRON_REMOTE_VAULT,
    //           wsRoot,
    //         });
    //         expect(GitUtils.isRepo(rVaultPath)).toBeTruthy();
    //         done();
    //       });
    //     });
    // });
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
