import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  ENGINE_HOOKS,
  GitTestUtils,
  TestConfigUtils,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";
import { test, describe } from "mocha";
import { ExtensionProvider } from "../../ExtensionProvider";
import { ConfigUtils, VaultUtils } from "@dendronhq/common-all";
import sinon from "sinon";

suite("ReloadIndex", function () {
  const ctx = setupBeforeAfter(this, {
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
        expect(
          _.every(rootFiles.map((ent) => fs.existsSync(ent)))
        ).toBeTruthy();
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
        expect(
          _.every(
            rootFiles.map((ent) => fs.readFileSync(ent).indexOf("bond") >= 0)
          )
        ).toBeTruthy();
        done();
      },
    });
  });

  describe("WHEN there is a vault in a repo", () => {
    describe("AND that vault has a remote", () => {
      describeMultiWS("AND the vault was not marked as remote", { ctx }, () => {
        test("THEN it is marked as a remote vault", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteVault({
            wsRoot,
            vault,
            remoteDir,
          });

          await new ReloadIndexCommand().run();
          const configAfter = TestConfigUtils.getConfig({ wsRoot });
          const vaultsAfter = ConfigUtils.getVaults(configAfter);
          const vaultAfter = VaultUtils.getVaultByName({
            vaults: vaultsAfter,
            vname: VaultUtils.getName(vault),
          });
          expect(vaultAfter?.remote?.type).toEqual("git");
          expect(vaultAfter?.remote?.url).toEqual(remoteDir);
        });
      });

      describeMultiWS(
        "AND if the vault was already marked as a remote vault",
        {
          ctx,
          postSetupHook: async (opts) => {
            // Have to override the config here and not in `modConfigCb` because the vaults are not in the config by then
            TestConfigUtils.withConfig((config) => {
              const vaults = ConfigUtils.getVaults(config);
              vaults[0].remote = {
                type: "git",
                url: "https://github.com/dendronhq/example.git",
              };
              ConfigUtils.setVaults(config, vaults);
              return config;
            }, opts);
          },
        },
        () => {
          test("THEN we don't touch the configuration", async () => {
            const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
            const vault = vaults[0];
            const remoteDir = tmpDir().name;
            await GitTestUtils.createRepoForRemoteVault({
              wsRoot,
              vault,
              remoteDir,
            });
            const { workspaceService } = ExtensionProvider.getExtension();
            expect(workspaceService).toBeTruthy();
            const markVault = sinon.stub(
              workspaceService!,
              "markVaultAsRemoteInConfig"
            );

            await new ReloadIndexCommand().run();
            expect(markVault.called).toBeFalsy();
            markVault.restore();
          });
        }
      );
    });

    describeMultiWS("AND that repo does NOT have a remote", { ctx }, () => {
      test("THEN it is NOT marked as a remote vault", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vault = vaults[0];
        await GitTestUtils.createRepoForVault({
          wsRoot,
          vault,
        });

        await new ReloadIndexCommand().run();

        const configAfter = TestConfigUtils.getConfig({ wsRoot });
        const vaultsAfter = ConfigUtils.getVaults(configAfter);
        const vaultAfter = VaultUtils.getVaultByName({
          vaults: vaultsAfter,
          vname: VaultUtils.getName(vault),
        });
        expect(vaultAfter?.remote).toBeFalsy();
      });
    });

    describeMultiWS(
      "AND that repo contains the whole workspace and not just this vault",
      { ctx },
      () => {
        test("THEN it is NOT marked as a remote vault", async () => {
          // In this case, we don't want to mark it because the whole workspace
          // is in the repository and not just this vault. Someone who has the
          // workspace doesn't need to also clone the vault.
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const vault = vaults[0];
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);

          await new ReloadIndexCommand().run();

          const configAfter = TestConfigUtils.getConfig({ wsRoot });
          const vaultsAfter = ConfigUtils.getVaults(configAfter);
          const vaultAfter = VaultUtils.getVaultByName({
            vaults: vaultsAfter,
            vname: VaultUtils.getName(vault),
          });
          expect(vaultAfter?.remote).toBeFalsy();
        });
      }
    );
  });
});
