import {
  ConfigUtils,
  CONSTANTS,
  FOLDERS,
  VaultUtils,
  DendronConfig,
  ConfigService,
  URI,
} from "@dendronhq/common-all";
import { readYAMLAsync, tmpDir } from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { checkVaults, GitTestUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { before, describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { AddExistingVaultCommand } from "../../commands/AddExistingVaultCommand";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import {
  createSelfContainedVaultWithGit,
  createVaultWithGit,
  createWorkspaceWithGit,
  describeSingleWS,
} from "../testUtilsV3";

// these tests can run longer than the default 2s timeout;
const timeout = 5e3;

suite("AddExistingVaultCommand", function () {
  describe("GIVEN Add Existing Vault command is run on a workspace with self contained config disabled", () => {
    describeSingleWS(
      "WHEN a remote workspace vault is added",
      {
        modConfigCb: disableSelfContainedVaults,
        timeout: 1e6,
      },
      () => {
        before(() => {
          sinon.stub(vscode.commands, "executeCommand").resolves({});
        });
        test("THEN add vault, workspace to the config", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          const gitIgnore = path.join(wsRoot, ".gitignore");
          const vname = "vaultRemote";
          const gitIgnoreInsideVault = path.join(wsRoot, vname, ".gitignore");
          const vpath = path.join(wsRoot, vname);
          const cmd = new AddExistingVaultCommand(
            ExtensionProvider.getExtension()
          );
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              type: "remote",
              name: "dendron",
              path: vpath,
              pathRemote: remoteDir,
            })
          );
          await cmd.run();
          const rawConfig = (
            await ConfigService.instance().readRaw(URI.file(wsRoot))
          )._unsafeUnwrap() as DendronConfig;
          const workspaces = ConfigUtils.getWorkspace(rawConfig).workspaces;
          expect(workspaces).toEqual({
            [vname]: {
              remote: {
                type: "git",
                url: remoteDir,
              },
            },
          });

          await checkVaults(
            {
              wsRoot,
              vaults: [
                {
                  fsPath: "notes",
                  name: "dendron",
                  selfContained: true,
                  workspace: "vaultRemote",
                },
                vaults[0],
              ],
            },
            expect
          );
          expect(
            await FileTestUtils.assertInFile({
              fpath: gitIgnore,
              match: ["vaultRemote"],
            })
          ).toBeTruthy();
          expect(
            await FileTestUtils.assertInFile({
              fpath: gitIgnoreInsideVault,
              match: [".dendron.cache.*"],
            })
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "WHEN adding a standard local vault", // not self conatined
      {
        modConfigCb: disableSelfContainedVaults,
        timeout,
      },
      () => {
        const vaultName = "standard-vault";
        before(() => {
          sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "local" });
          sinon.stub(VSCodeUtils, "showInputBox").resolves(vaultName);
          sinon.stub(vscode.commands, "executeCommand").resolves({});
        });

        test("THEN the vault is added to the workspace", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const vaultPath = path.join(wsRoot, vaultName);
          await createVaultWithGit(vaultPath);
          const cmd = new AddExistingVaultCommand(
            ExtensionProvider.getExtension()
          );
          sinon.stub(cmd, "gatherDestinationFolder").resolves(vaultPath);
          await cmd.run();
          expect(await fs.pathExists(vaultPath)).toBeTruthy();
          expect(
            await fs.pathExists(
              path.join(vaultPath, CONSTANTS.DENDRON_CONFIG_FILE)
            )
          ).toBeFalsy();
          expect(
            await fs.pathExists(path.join(vaultPath, FOLDERS.NOTES))
          ).toBeFalsy();
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
          expect(vault?.selfContained).toBeFalsy();
          expect(vault?.name).toEqual(vaultName);
          expect(vault?.fsPath).toEqual(vaultName);
        });
      }
    );

    describeSingleWS(
      "WHEN adding a local self conatined vault with enableSelfConatinedVaults config set to false",
      {
        modConfigCb: disableSelfContainedVaults,
        timeout,
      },
      () => {
        const vaultName = "sc-vault";
        before(() => {
          sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "local" });
          sinon.stub(VSCodeUtils, "showInputBox").resolves(vaultName);
          sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
        });

        test("THEN the vault is added to the workspace", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const vaultPath = path.join(wsRoot, vaultName);
          await createSelfContainedVaultWithGit(vaultPath);
          const cmd = new AddExistingVaultCommand(
            ExtensionProvider.getExtension()
          );
          sinon.stub(cmd, "gatherDestinationFolder").resolves(vaultPath);
          await cmd.run();
          expect(await fs.pathExists(vaultPath)).toBeTruthy();
          expect(
            await fs.pathExists(
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
          expect(vault?.fsPath).toEqual(vaultName);
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
          const note = (
            await engine.findNotesMeta({ fname: "root", vault })
          )[0];
          expect(note).toBeTruthy();
          expect(note?.vault.name).toEqual(vaultName);
        });
      }
    );
  });
});

function enableSelfContainedVaults(config: DendronConfig) {
  config.dev!.enableSelfContainedVaults = true;
  return config;
}

function disableSelfContainedVaults(config: DendronConfig) {
  config.dev!.enableSelfContainedVaults = false;
  return config;
}

describe("GIVEN Add Existing Vault Command is run with self contained vaults enabled", function () {
  describeSingleWS(
    "WHEN adding a standard local vault", // not self conatined
    {
      modConfigCb: enableSelfContainedVaults,
      timeout,
    },
    () => {
      const vaultName = "standard-vault";
      before(() => {
        sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "local" });
        sinon.stub(VSCodeUtils, "showInputBox").resolves(vaultName);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
      });

      test("THEN the vault is added to the dependencies/localhost", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const sourcePath = path.join(wsRoot, vaultName);
        await createVaultWithGit(sourcePath);
        const cmd = new AddExistingVaultCommand(
          ExtensionProvider.getExtension()
        );
        const vaultPath = path.join(
          wsRoot,
          FOLDERS.DEPENDENCIES,
          FOLDERS.LOCAL_DEPENDENCY,
          vaultName
        );
        sinon.stub(cmd, "gatherDestinationFolder").resolves(sourcePath);
        await cmd.run();
        expect(await fs.pathExists(vaultPath)).toBeTruthy();
        expect(
          await fs.pathExists(
            path.join(vaultPath, CONSTANTS.DENDRON_CONFIG_FILE)
          )
        ).toBeFalsy();
        expect(
          await fs.pathExists(path.join(vaultPath, FOLDERS.NOTES))
        ).toBeFalsy();
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
        expect(vault?.selfContained).toBeFalsy();
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
    }
  );

  describeSingleWS(
    "WHEN adding a local self conatined vault",
    {
      modConfigCb: enableSelfContainedVaults,
      timeout,
    },
    () => {
      const vaultName = "sc-vault";
      before(() => {
        sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "local" });
        sinon.stub(VSCodeUtils, "showInputBox").resolves(vaultName);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
      });

      test("THEN the vault is added to the dependencies/localhost", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const sourcePath = path.join(wsRoot, vaultName);
        await createSelfContainedVaultWithGit(sourcePath);
        const cmd = new AddExistingVaultCommand(
          ExtensionProvider.getExtension()
        );
        sinon.stub(cmd, "gatherDestinationFolder").resolves(sourcePath);
        await cmd.run();
        const vaultPath = path.join(
          wsRoot,
          FOLDERS.DEPENDENCIES,
          FOLDERS.LOCAL_DEPENDENCY,
          vaultName
        );
        expect(await fs.pathExists(vaultPath)).toBeTruthy();
        expect(
          await fs.pathExists(
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

  describeSingleWS(
    "WHEN adding a remote self contained vault",
    { modConfigCb: enableSelfContainedVaults, timeout },
    () => {
      let vaultName: string;
      let remoteDir: string;
      before(async () => {
        // Create a self contained vault outside the current workspace
        remoteDir = tmpDir().name;
        await createSelfContainedVaultWithGit(remoteDir);
        vaultName = path.basename(remoteDir);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
      });

      test("THEN the vault is added at the dependencies/remote, and is self contained", async () => {
        const cmd = new AddExistingVaultCommand(
          ExtensionProvider.getExtension()
        );
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const vaultPath = path.join(wsRoot, FOLDERS.DEPENDENCIES, vaultName);
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            type: "remote",
            name: vaultName,
            path: vaultPath,
            pathRemote: remoteDir,
            isSelfContained: true,
          })
        );
        await cmd.run();

        expect(await fs.pathExists(vaultPath)).toBeTruthy();
        expect(
          await fs.pathExists(path.join(vaultPath, FOLDERS.NOTES))
        ).toBeTruthy();
        expect(
          await readYAMLAsync(
            path.join(vaultPath, CONSTANTS.DENDRON_CONFIG_FILE)
          )
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
          path.posix.join(FOLDERS.DEPENDENCIES, vaultName)
        );
        expect(vault?.remote?.url).toEqual(remoteDir);
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

  describeSingleWS(
    "WHEN adding a remote workspace vault",
    { modConfigCb: enableSelfContainedVaults, timeout },
    () => {
      let vaultName: string;
      let remoteDir: string;
      before(async () => {
        // Create a self contained vault outside the current workspace
        remoteDir = tmpDir().name;
        await createWorkspaceWithGit(remoteDir);
        vaultName = path.basename(remoteDir);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
      });

      test("THEN the vault added, and is a workspace vault", async () => {
        const cmd = new AddExistingVaultCommand(
          ExtensionProvider.getExtension()
        );

        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const vaultPath = path.join(wsRoot, vaultName);
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            type: "remote",
            name: vaultName,
            path: vaultPath,
            pathRemote: remoteDir,
          })
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
        ).toBeFalsy();
      });

      test("THEN the vault was added to the workspace config correctly", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        await new ReloadIndexCommand().run();
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        expect(ConfigUtils.getVaults(config).length).toEqual(2);
        const vault = ConfigUtils.getVaults(config).find(
          (vault) => vault.workspace === vaultName
        );
        expect(vault?.selfContained).toBeFalsy();
        expect(vault?.fsPath).toEqual("vault");
        expect(config.workspace.workspaces).toBeTruthy();
        expect(config.workspace.workspaces![vaultName]).toBeTruthy();
        expect(config.workspace.workspaces![vaultName]?.remote.url).toEqual(
          remoteDir
        );
        expect(vault?.remote?.url).toBeFalsy();
      });

      test("THEN the notes in this vault are accessible", async () => {
        // Since we mock the reload window, need to reload index here to pick up the notes in the new vault
        await new ReloadIndexCommand().run();
        const { engine } = ExtensionProvider.getDWorkspace();
        const config = (
          await ConfigService.instance().readConfig(URI.file(engine.wsRoot))
        )._unsafeUnwrap();
        const vault = ConfigUtils.getVaults(config).find(
          (vault) => vault.workspace === vaultName
        );
        expect(vault).toBeTruthy();
        const note = (await engine.findNotesMeta({ fname: "root", vault }))[0];
        expect(note).toBeTruthy();
        expect(note?.vault.workspace).toEqual(vaultName);
      });
    }
  );

  describeSingleWS(
    "WHEN adding a remote regular (non self contained) vault",
    { modConfigCb: enableSelfContainedVaults, timeout },
    () => {
      let vaultName: string;
      let remoteDir: string;
      before(async () => {
        // Create a self contained vault outside the current workspace
        remoteDir = tmpDir().name;
        await createVaultWithGit(remoteDir);
        vaultName = path.basename(remoteDir);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
      });

      test("THEN the vault is added to the workspace, and is a regular vault", async () => {
        const cmd = new AddExistingVaultCommand(
          ExtensionProvider.getExtension()
        );

        const { wsRoot } = ExtensionProvider.getDWorkspace();
        fs.ensureDir(path.join(wsRoot, "testing"));
        const vaultPath = path.join(wsRoot, FOLDERS.DEPENDENCIES, vaultName);
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            type: "remote",
            name: vaultName,
            path: vaultPath,
            pathRemote: remoteDir,
          })
        );
        await cmd.run();
        expect(await fs.pathExists(vaultPath)).toBeTruthy();
        expect(
          await fs.pathExists(path.join(vaultPath, FOLDERS.NOTES))
        ).toBeFalsy();
        expect(
          await fs.pathExists(
            path.join(vaultPath, CONSTANTS.DENDRON_CONFIG_FILE)
          )
        ).toBeFalsy();
      });

      test("THEN the vault was added to the workspace config correctly", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        expect(ConfigUtils.getVaults(config).length).toEqual(2);
        const vault = VaultUtils.getVaultByName({
          vaults: ConfigUtils.getVaults(config),
          vname: vaultName,
        });

        expect(vault?.selfContained).toBeFalsy();
        expect(vault?.fsPath).toEqual(
          // vault paths always use UNIX style
          path.posix.join(FOLDERS.DEPENDENCIES, vaultName)
        );
        expect(vault?.remote?.url).toEqual(remoteDir);
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
