import {
  IntermediateDendronConfig,
  DVault,
  WorkspaceSettings,
  ConfigUtils,
  VaultUtils,
  NoteUtils,
  SchemaUtils,
} from "@dendronhq/common-all";
import {
  DConfig,
  LocalConfigScope,
  note2File,
  readYAML,
  schemaModuleOpts2File,
  writeYAML,
} from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { setupWS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { VaultAddCommand } from "../../commands/VaultAddCommand";
import { VaultRemoveCommand } from "../../commands/VaultRemoveCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  stubVaultInput,
} from "../testUtilsV3";

async function addWorkspaceVault({
  vaults,
  wsName,
}: {
  vaults: DVault[];
  wsName: string;
}) {
  const { wsRoot } = await setupWS({
    vaults,
    asRemote: true,
  });
  // stub
  const cmd = new VaultAddCommand();
  stubVaultInput({
    cmd,
    sourceType: "remote",
    sourcePath: wsName,
    sourcePathRemote: wsRoot,
    sourceName: "dendron",
  });
  await cmd.run();
  return { wsRoot, vaults };
}

function stubQuickPick(vault: DVault) {
  // @ts-ignore
  VSCodeUtils.showQuickPick = () => {
    return { data: vault };
  };
}

function getConfig() {
  return DConfig.getRaw(
    ExtensionProvider.getDWorkspace().wsRoot
  ) as IntermediateDendronConfig;
}

function getWorkspaceFile() {
  const settings = fs.readJSONSync(
    DendronExtension.workspaceFile().fsPath
  ) as WorkspaceSettings;
  return settings;
}

suite("GIVEN VaultRemoveCommand", function () {
  this.beforeEach(() => {
    sinon.stub(vscode.commands, "executeCommand").resolves({});
  });

  describeMultiWS("WHEN removing a workspace vault", {}, () => {
    test("THEN the vault is removed", async () => {
      const { vaults } = ExtensionProvider.getDWorkspace();
      const remoteVaultName = "remoteVault";
      const remoteWsName = "remoteWs";
      const vaultsRemote = [{ fsPath: remoteVaultName }];
      await addWorkspaceVault({
        vaults: vaultsRemote,
        wsName: remoteWsName,
      });
      stubQuickPick({ fsPath: remoteVaultName, workspace: remoteWsName });
      await new VaultRemoveCommand(ExtensionProvider.getExtension()).run();
      const config = getConfig();
      expect(ConfigUtils.getVaults(config)).toEqual(vaults);
      expect(ConfigUtils.getWorkspace(config).workspaces).toEqual({});
      expect(
        _.find(getWorkspaceFile().folders, {
          path: path.join(remoteWsName, remoteVaultName),
        })
      ).toEqual(undefined);
    });
  });

  describeMultiWS("WHEN removing a regular vault", {}, () => {
    test("THEN the vault is removed", async () => {
      const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();
      const vaultToRemove = vaults[1];
      sinon.stub(VSCodeUtils, "showQuickPick").resolves({
        // VaultRemoveCommand uses this internally, but TypeScript doesn't recognize it for the stub
        // @ts-ignore
        data: vaultToRemove,
      });
      await new VaultRemoveCommand(ExtensionProvider.getExtension()).run();

      // Shouldn't delete the actual files
      expect(
        FileTestUtils.cmpFilesV2(path.join(wsRoot, vaultToRemove.fsPath), [
          "root.md",
          "root.schema.yml",
        ])
      ).toBeTruthy();

      // check that the config updated
      const config = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;
      expect(ConfigUtils.getVaults(config).map((ent) => ent.fsPath)).toEqual([
        vaults[0].fsPath,
        vaults[2].fsPath,
      ]);

      // check vscode settings updated
      const settings = (await fs.readJSON(
        DendronExtension.workspaceFile().fsPath
      )) as WorkspaceSettings;
      expect(settings.folders).toEqual([
        { path: vaults[0].fsPath },
        { path: vaults[2].fsPath },
      ]);
    });
  });

  describe("WHEN removing a vault when override is present", () => {
    describeMultiWS(
      "WHEN removing a regular vault",
      {
        timeout: 1e9,
        preSetupHook: async ({ wsRoot }) => {
          // // create a vault that we are adding as override
          const vpath = path.join(wsRoot, "vault4");
          fs.ensureDirSync(vpath);
          const vault = { fsPath: vpath };

          const note = NoteUtils.createRoot({
            vault: { fsPath: vpath },
            body: ["existing note"].join("\n"),
          });
          await note2File({ note, vault, wsRoot });
          const schema = SchemaUtils.createRootModule({ vault });
          await schemaModuleOpts2File(schema, vault.fsPath, "root");
          const overridePath = DConfig.configOverridePath(
            wsRoot,
            LocalConfigScope.WORKSPACE
          );
          const overridePayload = {
            workspace: {
              vaults: [{ fsPath: "vault4" }],
            },
          };
          writeYAML(overridePath, overridePayload);
        },
      },
      () => {
        test("THEN the vault is removed from dendron.yml, and override is not merged into config", async () => {
          const { wsRoot, config } = ExtensionProvider.getDWorkspace();
          const vaultToRemove = { fsPath: "vault2" };

          // before remove, we have 4 vaults including the overriden one
          expect(config.workspace.vaults.length).toEqual(4);
          // before remove, dendron.yml has 3 vaults
          const preRunConfig = DConfig.readConfigSync(wsRoot);
          expect(preRunConfig.workspace.vaults.length).toEqual(3);

          sinon.stub(VSCodeUtils, "showQuickPick").resolves({
            // VaultRemoveCommand uses this internally, but TypeScript doesn't recognize it for the stub
            // @ts-ignore
            data: vaultToRemove,
          });
          await new VaultRemoveCommand(ExtensionProvider.getExtension()).run();

          // after remove, we have 2 vaults in dendron.yml
          const postRunConfig = DConfig.readConfigSync(wsRoot);
          expect(postRunConfig.workspace.vaults.length).toEqual(2);

          // after remove, we have 3 vaults including the overriden one
          const postRunConfigWithOverride =
            ExtensionProvider.getDWorkspace().config;
          expect(postRunConfigWithOverride.workspace.vaults.length).toEqual(3);
        });
      }
    );
  });

  describeMultiWS(
    "WHEN removing a self contained vault",
    { selfContained: true },
    () => {
      test("THEN the vault is removed", async () => {
        const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();
        const vaultToRemove = vaults[1];
        sinon.stub(VSCodeUtils, "showQuickPick").resolves({
          // VaultRemoveCommand uses this internally, but TypeScript doesn't recognize it for the stub
          // @ts-ignore
          data: vaultToRemove,
        });
        await new VaultRemoveCommand(ExtensionProvider.getExtension()).run();

        // Shouldn't delete the actual files
        expect(
          FileTestUtils.cmpFilesV2(
            path.join(wsRoot, VaultUtils.getRelPath(vaultToRemove)),
            ["root.md", "root.schema.yml"]
          )
        ).toBeTruthy();

        // check that the config updated
        const config = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;
        expect(ConfigUtils.getVaults(config).map((ent) => ent.fsPath)).toEqual([
          vaults[0].fsPath,
          vaults[2].fsPath,
        ]);

        // check vscode settings updated
        const settings = (await fs.readJSON(
          DendronExtension.workspaceFile().fsPath
        )) as WorkspaceSettings;
        expect(settings.folders).toEqual([
          { path: VaultUtils.getRelPath(vaults[0]) },
          { path: VaultUtils.getRelPath(vaults[2]) },
        ]);
      });
    }
  );

  describeMultiWS(
    "WHEN removing the top level self contained vault",
    { selfContained: true },
    () => {
      test("THEN the vault is removed", async () => {
        const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();
        const vaultToRemove = vaults[0];
        sinon.stub(VSCodeUtils, "showQuickPick").resolves({
          // VaultRemoveCommand uses this internally, but TypeScript doesn't recognize it for the stub
          // @ts-ignore
          data: vaultToRemove,
        });
        await new VaultRemoveCommand(ExtensionProvider.getExtension()).run();

        // Shouldn't delete the actual files
        expect(
          FileTestUtils.cmpFilesV2(
            path.join(wsRoot, VaultUtils.getRelPath(vaultToRemove)),
            ["root.md", "root.schema.yml"]
          )
        ).toBeTruthy();

        // check that the config updated
        const config = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;
        expect(ConfigUtils.getVaults(config).map((ent) => ent.fsPath)).toEqual([
          vaults[1].fsPath,
          vaults[2].fsPath,
        ]);

        // check vscode settings updated
        const settings = (await fs.readJSON(
          DendronExtension.workspaceFile().fsPath
        )) as WorkspaceSettings;
        expect(settings.folders).toEqual([
          { path: VaultUtils.getRelPath(vaults[1]) },
          { path: VaultUtils.getRelPath(vaults[2]) },
        ]);
      });
    }
  );

  describeSingleWS("WHEN there's only one vault left after remove", {}, () => {
    test("THEN duplicateNoteBehavior is omitted", async () => {
      const { wsRoot } = ExtensionProvider.getDWorkspace();
      const configPath = DConfig.configPath(wsRoot as string);

      // add a second vault
      const vault2 = "vault2";

      stubVaultInput({ sourceType: "local", sourcePath: vault2 });
      await new VaultAddCommand().run();

      const config = readYAML(configPath) as IntermediateDendronConfig;
      // confirm that duplicateNoteBehavior option exists
      const publishingConfig = ConfigUtils.getPublishingConfig(config);
      expect(publishingConfig.duplicateNoteBehavior).toBeTruthy();

      const vaultsAfter = ExtensionProvider.getDWorkspace().vaults;
      // @ts-ignore
      VSCodeUtils.showQuickPick = () => {
        return { data: vaultsAfter[1] };
      };
      await new VaultRemoveCommand(ExtensionProvider.getExtension()).run();

      const configNew = readYAML(configPath) as IntermediateDendronConfig;
      // confirm that duplicateNoteBehavior setting is gone
      const publishingConfigNew = ConfigUtils.getPublishingConfig(configNew);
      expect(publishingConfigNew.duplicateNoteBehavior).toBeFalsy();
    });
  });
  describeSingleWS("WHEN a published vault is removed", {}, () => {
    test("THEN the vault is removed from duplicateNoteBehavior payload", async () => {
      const { wsRoot } = ExtensionProvider.getDWorkspace();
      // add two more vaults

      const vpath2 = "vault2";
      const vpath3 = "vault3";

      stubVaultInput({ sourceType: "local", sourcePath: vpath2 });
      await new VaultAddCommand().run();

      stubVaultInput({ sourceType: "local", sourcePath: vpath3 });
      await new VaultAddCommand().run();

      const vaultsAfter = ExtensionProvider.getDWorkspace().vaults;

      const configOrig = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;
      // check what we are starting from.
      const origVaults = ConfigUtils.getVaults(configOrig);
      expect(origVaults.map((ent) => ent.fsPath)).toEqual([
        vaultsAfter[0].fsPath,
        vaultsAfter[1].fsPath,
        vaultsAfter[2].fsPath,
      ]);

      // @ts-ignore
      VSCodeUtils.showQuickPick = () => {
        return { data: vaultsAfter[1] };
      };
      await new VaultRemoveCommand(ExtensionProvider.getExtension()).run();

      const config = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;

      // check that "vault2" is gone from payload
      const publishingConfig = ConfigUtils.getPublishingConfig(config);
      expect(publishingConfig.duplicateNoteBehavior!.payload).toEqual([
        VaultUtils.getName(vaultsAfter[2]),
        VaultUtils.getName(vaultsAfter[0]),
      ]);
    });
  });

  describe("WHEN it's used from the Contextual-UI", () => {
    describeMultiWS("AND it removes a regular vault vault1", {}, () => {
      test("THEN vault1 should be removed from workspace and config", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const args = {
          fsPath: path.join(wsRoot, vaults[1].fsPath),
        };
        await new VaultRemoveCommand(ExtensionProvider.getExtension()).run(
          args
        );
        const config = getConfig();
        expect(ConfigUtils.getVaults(config)).toNotEqual(vaults);
        expect(
          _.find(getWorkspaceFile().folders, {
            path: path.join(vaults[1].fsPath),
          })
        ).toEqual(undefined);
      });
    });
    describe("AND it removes a remote workspace vault remoteWs", () => {
      test("THEN remoteWs should be removed from workspace and config", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const remoteVaultName = "remoteVault";
        const remoteWsName = "remoteWs";
        const vaultsRemote = [{ fsPath: remoteVaultName }];
        await addWorkspaceVault({
          vaults: vaultsRemote,
          wsName: remoteWsName,
        });
        const args = {
          fsPath: path.join(wsRoot, remoteWsName, remoteVaultName),
        };
        await new VaultRemoveCommand(ExtensionProvider.getExtension()).run(
          args
        );
        const config = getConfig();
        expect(ConfigUtils.getVaults(config)).toEqual(vaults);
        expect(ConfigUtils.getWorkspace(config).workspaces).toEqual({});
        expect(
          _.find(getWorkspaceFile().folders, {
            path: path.join(remoteWsName, remoteVaultName),
          })
        ).toEqual(undefined);
      });
    });
  });
});
