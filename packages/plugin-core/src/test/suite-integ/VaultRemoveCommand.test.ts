import { DendronConfig } from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import assert from "assert";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { VaultAddCommand } from "../../commands/VaultAddCommand";
import { VaultRemoveCommand } from "../../commands/VaultRemoveCommand";
import { WorkspaceSettings } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { expect, runMultiVaultTest, runSingleVaultTest } from "../testUtilsv2";
import { setupBeforeAfter, stubVaultInput } from "../testUtilsV3";

suite("VaultRemoveCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", (done) => {
    runMultiVaultTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        // @ts-ignore
        VSCodeUtils.showQuickPick = () => {
          return { data: vaults[1] };
        };
        await new VaultRemoveCommand().run();

        // check no files deleted
        assert.deepStrictEqual(
          fs.readdirSync(path.join(wsRoot, vaults[1].fsPath)),
          [
            "bar.ch1.md",
            "bar.md",
            "bar.schema.yml",
            "root.md",
            "root.schema.yml",
          ]
        );

        // check config updated
        const configPath = DConfig.configPath(
          DendronWorkspace.wsRoot() as string
        );
        const config = readYAML(configPath) as DendronConfig;
        assert.deepStrictEqual(
          config.vaults.map((ent) => ent.fsPath),
          [vaults[0].fsPath]
        );

        // check vscode settings updated
        const settings = fs.readJSONSync(
          DendronWorkspace.workspaceFile().fsPath
        ) as WorkspaceSettings;
        assert.deepStrictEqual(settings.folders, [{ path: vaults[0].fsPath }]);
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
          vault.fsPath.replace("../", ""),
          "vault3",
        ]);
        done();
      },
    });
  });
});
