import {
  DendronConfig,
  DVault,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { DConfig } from "@dendronhq/engine-server";
import { setupWS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { VaultAddCommand } from "../../commands/VaultAddCommand";
import { VaultRemoveCommand } from "../../commands/VaultRemoveCommand";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { expect, runMultiVaultTest, runSingleVaultTest } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  stubVaultInput,
} from "../testUtilsV3";

const addWorkspaceVault = async ({
  vaults,
  wsName,
}: {
  vaults: DVault[];
  wsName: string;
}) => {
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
};

const stubQuickPick = (vault: DVault) => {
  // @ts-ignore
  VSCodeUtils.showQuickPick = () => {
    return { data: vault };
  };
};

const getConfig = () => {
  const configPath = DConfig.configPath(DendronWorkspace.wsRoot() as string);
  const config = readYAML(configPath) as DendronConfig;
  return config;
};

const getWorkspaceFile = () => {
  const settings = fs.readJSONSync(
    DendronWorkspace.workspaceFile().fsPath
  ) as WorkspaceSettings;
  return settings;
};

suite("VaultRemoveCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      sinon
        .stub(vscode.commands, "executeCommand")
        .returns(Promise.resolve({}));
    },
    afterHook: () => {
      sinon.restore();
    },
  });

  describe("workspace", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ vaults }) => {
          const remoteVaultName = "remoteVault";
          const remoteWsName = "remoteWs";
          const vaultsRemote = [{ fsPath: remoteVaultName }];
          await addWorkspaceVault({
            vaults: vaultsRemote,
            wsName: remoteWsName,
          });
          stubQuickPick({ fsPath: remoteVaultName, workspace: remoteWsName });
          await new VaultRemoveCommand().run();
          const config = getConfig();
          expect(config.vaults).toEqual(vaults);
          expect(config.workspaces).toEqual({});
          expect(
            _.find(getWorkspaceFile().folders, {
              path: path.join(remoteWsName, remoteVaultName),
            })
          ).toEqual(undefined);
          done();
        },
      });
    });
  });

  describe("single vault", () => {
    test("basic", (done) => {
      runMultiVaultTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          // @ts-ignore
          VSCodeUtils.showQuickPick = () => {
            return { data: vaults[1] };
          };
          await new VaultRemoveCommand().run();

          expect(
            FileTestUtils.cmpFilesV2(path.join(wsRoot, vaults[1].fsPath), [
              "bar.ch1.md",
              "bar.md",
              "bar.schema.yml",
              "root.md",
              "root.schema.yml",
            ])
          ).toBeTruthy();

          // check config updated
          const configPath = DConfig.configPath(
            DendronWorkspace.wsRoot() as string
          );
          const config = readYAML(configPath) as DendronConfig;
          expect(config.vaults.map((ent) => ent.fsPath)).toEqual([
            vaults[0].fsPath,
          ]);

          // check vscode settings updated
          const settings = fs.readJSONSync(
            DendronWorkspace.workspaceFile().fsPath
          ) as WorkspaceSettings;
          expect(settings.folders).toEqual([{ path: vaults[0].fsPath }]);
          done();
        },
      });
    });

    test("omit duplicateNoteBehavior when only one vault left", (done) => {
      runSingleVaultTest({
        ctx,
        onInit: async ({ wsRoot }) => {
          const configPath = DConfig.configPath(
            DendronWorkspace.wsRoot() as string
          );

          // add a second vault
          const vpath2 = path.join(wsRoot, "vault2");

          stubVaultInput({ sourceType: "local", sourcePath: vpath2 });
          await new VaultAddCommand().run();

          const config = readYAML(configPath) as DendronConfig;
          // confirm that duplicateNoteBehavior option exists
          expect(config.site.duplicateNoteBehavior).toBeTruthy();

          const vaults = DendronWorkspace.instance().vaultsv4;

          // @ts-ignore
          VSCodeUtils.showQuickPick = () => {
            return { data: vaults[1] };
          };
          await new VaultRemoveCommand().run();

          const configNew = readYAML(configPath) as DendronConfig;
          // confirm that duplicateNoteBehavior setting is gone
          expect(configNew.site.duplicateNoteBehavior).toBeFalsy();

          done();
        },
      });
    });

    test("pull removed vault from duplicateNoteBehavior payload", (done) => {
      runSingleVaultTest({
        ctx,
        onInit: async ({ wsRoot, vault }) => {
          // add two more vaults

          const vpath2 = path.join(wsRoot, "vault2");
          const vpath3 = path.join(wsRoot, "vault3");

          stubVaultInput({ sourceType: "local", sourcePath: vpath2 });
          await new VaultAddCommand().run();

          stubVaultInput({ sourceType: "local", sourcePath: vpath3 });
          await new VaultAddCommand().run();

          const vaults = DendronWorkspace.instance().vaultsv4;

          const configPathOrig = DConfig.configPath(
            DendronWorkspace.wsRoot() as string
          );
          const configOrig = readYAML(configPathOrig) as DendronConfig;
          // check what we are starting from.
          expect(configOrig.vaults.map((ent) => ent.fsPath)).toEqual([
            vaults[0].fsPath,
            vaults[1].fsPath,
            vaults[2].fsPath,
          ]);

          // @ts-ignore
          VSCodeUtils.showQuickPick = () => {
            return { data: vaults[1] };
          };
          await new VaultRemoveCommand().run();

          const configPath = DConfig.configPath(
            DendronWorkspace.wsRoot() as string
          );
          const config = readYAML(configPath) as DendronConfig;

          // check that "vault2" is gone from payload
          expect(config.site.duplicateNoteBehavior!.payload).toEqual([
            path.parse(vault.fsPath).base,
            "vault3",
          ]);
          done();
        },
      });
    });
  });
});
