import {
  ConfigService,
  ConfigUtils,
  CONSTANTS,
  DendronConfig,
  FOLDERS,
  URI,
  VaultUtils,
} from "@dendronhq/common-all";
import { readYAMLAsync, vault2Path } from "@dendronhq/common-server";
import { checkVaults } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { before, describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { CreateNewVaultCommand } from "../../commands/CreateNewVaultCommand";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";

suite("CreateNewVault Command", function () {
  describe("GIVEN Create new vault command is run within a workspace", () => {
    describeSingleWS(
      "WHEN ran inside a workspace with dev.enableSelfContainedVaults config set to false",
      { modConfigCb: disableSelfContainedVaults, timeout: 1e4 },
      () => {
        before(async () => {
          sinon.stub(VSCodeUtils, "showInputBox").resolves();
          sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
        });
        test("THEN create a new standard vault at selected destination", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const vpath = path.join(wsRoot, "vault2");
          const cmd = new CreateNewVaultCommand(
            ExtensionProvider.getExtension()
          );
          sinon.stub(cmd, "gatherDestinationFolder").resolves(vpath);
          await cmd.run();

          const vaultsAfter = await ExtensionProvider.getDWorkspace().vaults;

          expect(vaultsAfter.length).toEqual(2);
          expect(
            await fs.readdir(vault2Path({ vault: vaultsAfter[1], wsRoot }))
          ).toEqual([
            ".dendron.cache.json",
            ".vscode",
            "assets",
            "root.md",
            "root.schema.yml",
          ]);
          await checkVaults(
            {
              wsRoot,
              vaults: vaultsAfter,
            },
            expect
          );
        });
      }
    );
  });
});

function enableSelfCOntainedVaults(config: DendronConfig) {
  config.dev!.enableSelfContainedVaults = true;
  return config;
}

function disableSelfContainedVaults(config: DendronConfig) {
  config.dev!.enableSelfContainedVaults = false;
  return config;
}

describe("GIVEN Create existing vault command is run with self contained vaults enabled", function () {
  describeSingleWS(
    "WHEN creating a vault",
    {
      modConfigCb: enableSelfCOntainedVaults,
      timeout: 5e3,
    },
    () => {
      const vaultName = "my-self-contained-vault";
      before(async () => {
        sinon.stub(VSCodeUtils, "showInputBox").resolves(vaultName);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
      });

      test("THEN new vault is created in dependencies/localhost folder, and is self contained", async () => {
        const cmd = new CreateNewVaultCommand(ExtensionProvider.getExtension());
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const vaultPath = path.join(
          wsRoot,
          FOLDERS.DEPENDENCIES,
          FOLDERS.LOCAL_DEPENDENCY,
          vaultName
        );
        await cmd.run();

        expect(await fs.pathExists(vaultPath)).toBeTruthy();
        expect(
          await readYAMLAsync(
            path.join(vaultPath, CONSTANTS.DENDRON_CONFIG_FILE)
          )
        ).toBeTruthy();
        expect(
          await fs.pathExists(path.join(vaultPath, FOLDERS.NOTES))
        ).toBeTruthy();
      });

      test("THEN the vault was added to the workspace config correctly", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const vault = VaultUtils.getVaultByName({
          vaults: ConfigUtils.getVaults(config),
          vname: vaultName,
        });
        expect(vault?.selfContained).toBeTruthy();
        expect(vault?.name).toEqual(vaultName);
        expect(vault?.fsPath).toEqual(
          // vault paths always use UNIX style
          path.posix.join(
            FOLDERS.DEPENDENCIES,
            FOLDERS.LOCAL_DEPENDENCY,
            vaultName
          )
        );
      });

      test("THEN the notes in this vault are accessible", async () => {
        // Since we mock the reload window, need to reload index here to pick up the notes in the new vault
        await new ReloadIndexCommand().run();
        const ws = ExtensionProvider.getDWorkspace();
        const { engine } = ws;
        const vaults = await ws.vaults;
        const vault = VaultUtils.getVaultByName({
          vaults,
          vname: vaultName,
        });
        expect(vault).toBeTruthy();
        const note = (await engine.findNotesMeta({ fname: "root", vault }))[0];
        expect(note).toBeTruthy();
        expect(note?.vault.name).toEqual(vaultName);
      });
    }
  );
});
