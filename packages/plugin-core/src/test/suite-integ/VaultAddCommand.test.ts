import {
  ConfigUtils,
  CONSTANTS,
  DVault,
  FOLDERS,
  DendronConfig,
  normalizeUnixPath,
  NoteUtils,
  SchemaUtils,
  VaultUtils,
  WorkspaceType,
  ConfigService,
  URI,
} from "@dendronhq/common-all";
import {
  note2File,
  readYAMLAsync,
  schemaModuleOpts2File,
  tmpDir,
  vault2Path,
  writeYAML,
} from "@dendronhq/common-server";
import { FileTestUtils, SinonStubbedFn } from "@dendronhq/common-test-utils";
import { Git, WorkspaceService } from "@dendronhq/engine-server";
import {
  checkVaults,
  GitTestUtils,
  setupWS,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { before, describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { VaultAddCommand } from "../../commands/VaultAddCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import {
  createSelfContainedVaultWithGit,
  createVaultWithGit,
  createWorkspaceWithGit,
  describeSingleWS,
  runTestButSkipForWindows,
  stubVaultInput,
} from "../testUtilsV3";

suite("VaultAddCommand", function () {
  const beforeHook = () => {
    // prevents a ReloadWorkspace
    sinon.stub(vscode.commands, "executeCommand").resolves({});
  };

  // TODO: need to stub git clone with side effects
  describe("remote", () => {
    this.beforeEach(beforeHook);

    describeSingleWS("WHEN running VaultAdd", { timeout: 1e6 }, () => {
      test("THEN add vault to config", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;

        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const gitIgnore = path.join(wsRoot, ".gitignore");
        const gitIgnoreInsideVault = path.join(
          wsRoot,
          "vaultRemote",
          ".gitignore"
        );

        const cmd = new VaultAddCommand();
        stubVaultInput({
          cmd,
          sourceType: "remote",
          sourcePath: "vaultRemote",
          sourcePathRemote: remoteDir,
          sourceName: "dendron",
        });
        await cmd.run();

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
    });

    describeSingleWS("WHEN add vault inside workspace", {}, () => {
      test("THEN workspace vault is added", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const { wsRoot: remoteDir } = await setupWS({
          vaults: [{ fsPath: "vault1" }],
          asRemote: true,
        });

        // stub
        const gitIgnore = path.join(wsRoot, ".gitignore");

        const cmd = new VaultAddCommand();
        const wsName = "wsRemote";
        stubVaultInput({
          cmd,
          sourceType: "remote",
          sourcePath: wsName,
          sourcePathRemote: remoteDir,
          sourceName: "dendron",
        });
        await cmd.run();
        const gitIgnoreInsideVault = path.join(wsRoot, wsName, ".gitignore");

        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const workspaces = ConfigUtils.getWorkspace(config).workspaces;
        expect(workspaces).toEqual({
          [wsName]: {
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
                fsPath: "vault1",
                workspace: wsName,
                name: "dendron",
              },
              vaults[0],
            ],
          },
          expect
        );
        expect(
          await FileTestUtils.assertInFile({
            fpath: gitIgnore,
            match: [wsName],
          })
        ).toBeTruthy();
        expect(
          await FileTestUtils.assertInFile({
            fpath: gitIgnoreInsideVault,
            match: [".dendron.cache.*"],
          })
        ).toBeTruthy();
      });
    });

    describeSingleWS(
      "AND WHEN add workspace vault with same name as existing vault",
      {},
      () => {
        test("THEN do right thing", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;
          // create remote repo
          const remoteDir = tmpDir().name;
          const vaultPath = "vault";
          const vaultsRemote: DVault[] = [{ fsPath: vaultPath }];
          await WorkspaceService.createWorkspace({
            wsRoot: remoteDir,
            additionalVaults: vaultsRemote,
          });
          await GitTestUtils.createRepoWithReadme(remoteDir);

          // stub
          const gitIgnore = path.join(wsRoot, ".gitignore");
          const cmd = new VaultAddCommand();
          const wsName = "wsRemote";
          stubVaultInput({
            cmd,
            sourceType: "remote",
            sourcePath: wsName,
            sourcePathRemote: remoteDir,
            sourceName: "dendron",
          });
          await cmd.run();

          const config = (
            await ConfigService.instance().readConfig(URI.file(wsRoot))
          )._unsafeUnwrap();
          const workspaces = ConfigUtils.getWorkspace(config).workspaces;
          expect(workspaces).toEqual({
            [wsName]: {
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
                  fsPath: normalizeUnixPath(vaultPath),
                  workspace: wsName,
                  name: "dendron",
                },
                vaults[0],
              ],
            },
            expect
          );
          expect(
            await FileTestUtils.assertInFile({
              fpath: gitIgnore,
              match: [wsName],
            })
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS("WHEN vault was already in .gitignore", {}, () => {
      describe("AND vaultAddCommand is run", () => {
        test("THEN vault is not duplicated", async () => {
          const vaultPath = "vaultRemote";
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const gitIgnore = path.join(wsRoot, ".gitignore");
          const remoteDir = tmpDir().name;

          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await fs.writeFile(gitIgnore, vaultPath);

          const cmd = new VaultAddCommand();
          stubVaultInput({
            cmd,
            sourceType: "remote",
            sourcePath: vaultPath,
            sourcePathRemote: remoteDir,
            sourceName: "dendron",
          });
          await cmd.run();

          expect(
            await FileTestUtils.assertTimesInFile({
              fpath: gitIgnore,
              match: [[1, vaultPath]],
            })
          ).toBeTruthy();
        });
      });
    });
  });

  describe("local", () => {
    describeSingleWS(
      "WHEN add to existing folder",
      {
        modConfigCb: disableSelfContainedVaults,
        postSetupHook: async ({ wsRoot }) => {
          const vpath = path.join(wsRoot, "vault2");
          fs.ensureDirSync(vpath);
          const vault = { fsPath: vpath };

          const note = NoteUtils.createRoot({
            vault: { fsPath: vpath },
            body: ["existing note"].join("\n"),
          });
          await note2File({ note, vault, wsRoot });
          const schema = SchemaUtils.createRootModule({ vault });
          await schemaModuleOpts2File(schema, vault.fsPath, "root");
        },
        timeout: 1e4,
      },
      () => {
        test("THEN do right thing", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const vpath = path.join(wsRoot, "vault2");
          stubVaultInput({ sourceType: "local", sourcePath: vpath });

          await new VaultAddCommand().run();
          expect(await fs.readdir(vpath)).toEqual([
            ".gitignore",
            "root.md",
            "root.schema.yml",
          ]);
          const vaultsAfter = await ExtensionProvider.getDWorkspace().vaults;
          await checkVaults(
            {
              wsRoot,
              vaults: vaultsAfter,
            },
            expect
          );
          expect(vaultsAfter.length).toEqual(2);

          // new file added to newline
          expect(
            await FileTestUtils.assertInFile({
              fpath: path.join(wsRoot, ".gitignore"),
              match: ["vault2"],
            })
          ).toBeTruthy();

          // check note is still existing note
          expect(
            await FileTestUtils.assertInFile({
              fpath: path.join(vpath, "root.md"),
              match: ["existing note"],
            })
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "AND WHEN add absolute path inside wsRoot",
      { modConfigCb: disableSelfContainedVaults },
      () => {
        test("THEN do right thing", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const vpath = path.join(wsRoot, "vault2");
          stubVaultInput({ sourceType: "local", sourcePath: vpath });
          await new VaultAddCommand().run();

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

    describeSingleWS(
      "AND WHEN add rel path inside wsRoot",
      { modConfigCb: disableSelfContainedVaults, timeout: 1e4 },
      () => {
        test("THEN do right thing", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const sourcePath = "vault2";
          stubVaultInput({ sourceType: "local", sourcePath });
          await new VaultAddCommand().run();

          const vaultsAfter = await ExtensionProvider.getDWorkspace().vaults;
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

    describeSingleWS(
      "AND WHEN add absolute path outside of wsRoot",
      {
        modConfigCb: disableSelfContainedVaults,
      },
      () => {
        test("THEN do right thing", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const vpath = tmpDir().name;
          stubVaultInput({ sourceType: "local", sourcePath: vpath });
          await new VaultAddCommand().run();
          const vaultsAfter = await ExtensionProvider.getDWorkspace().vaults;
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

describe("GIVEN a workspace with local override", function () {
  const beforeHook = () => {
    // prevents a ReloadWorkspace
    sinon.stub(vscode.commands, "executeCommand").resolves({});
  };
  describeSingleWS(
    "WHEN adding a vault",
    {
      preSetupHook: async ({ wsRoot }) => {
        // create a vault that we are adding as override
        const vpath = path.join(wsRoot, "vault2");
        fs.ensureDirSync(vpath);
        const vault = { fsPath: vpath };

        const note = NoteUtils.createRoot({
          vault: { fsPath: vpath },
          body: ["existing note"].join("\n"),
        });
        await note2File({ note, vault, wsRoot });
        const schema = SchemaUtils.createRootModule({ vault });
        await schemaModuleOpts2File(schema, vault.fsPath, "root");
        // add it to workspace override
        const overridePath = ConfigService.instance().configOverridePath(
          URI.file(wsRoot),
          "workspace"
        );
        const overridePayload = {
          workspace: {
            vaults: [{ fsPath: "vault2" }],
          },
        };
        writeYAML(overridePath!.fsPath, overridePayload);
      },
    },
    () => {
      this.beforeEach(beforeHook);
      test("locally overriden vault is not merged into config", async () => {
        const vaultPath = "vaultRemote";
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const gitIgnore = path.join(wsRoot, ".gitignore");
        const remoteDir = tmpDir().name;

        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        await fs.writeFile(gitIgnore, vaultPath);

        const preRunConfigWithOverride = await ws.config;
        // the config that has local override should have two vaults
        expect(preRunConfigWithOverride.workspace.vaults.length).toEqual(2);

        // dendron.yml should have one vault;
        const preRunConfig = (
          await ConfigService.instance().readConfig(URI.file(wsRoot), {
            applyOverride: false,
          })
        )._unsafeUnwrap();
        expect(preRunConfig.workspace.vaults.length).toEqual(1);
        const cmd = new VaultAddCommand();
        stubVaultInput({
          cmd,
          sourceType: "remote",
          sourcePath: vaultPath,
          sourcePathRemote: remoteDir,
          sourceName: "dendron",
        });
        await cmd.run();
        // dendron.yml should now have two vault
        const postRunConfig = (
          await ConfigService.instance().readConfig(URI.file(wsRoot), {
            applyOverride: false,
          })
        )._unsafeUnwrap();
        expect(postRunConfig.workspace.vaults.length).toEqual(2);
        // config + override should have three vaults
        const postRunConfigWithOverride =
          await ExtensionProvider.getDWorkspace().config;
        expect(postRunConfigWithOverride.workspace.vaults.length).toEqual(3);
      });
    }
  );
});

describe("GIVEN VaultAddCommand with self contained vaults enabled", function () {
  describeSingleWS(
    "WHEN creating and adding a local vault",
    {
      modConfigCb: enableSelfCOntainedVaults,
    },
    () => {
      const vaultName = "my-self-contained-vault";
      before(async () => {
        sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "local" });
        sinon.stub(VSCodeUtils, "showInputBox").resolves(vaultName);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window

        await new VaultAddCommand().run();
      });

      test("THEN the vault is under `dependencies/localhost`, and is self contained", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const vaultPath = path.join(
          wsRoot,
          FOLDERS.DEPENDENCIES,
          FOLDERS.LOCAL_DEPENDENCY,
          vaultName
        );
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

  describeSingleWS(
    "WHEN creating and adding a remote self contained vault",
    { modConfigCb: enableSelfCOntainedVaults },
    () => {
      let vaultName: string;
      let remoteDir: string;
      before(async () => {
        // Create a self contained vault outside the current workspace
        remoteDir = tmpDir().name;
        await createSelfContainedVaultWithGit(remoteDir);
        vaultName = path.basename(remoteDir);

        sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
        sinon.stub(VSCodeUtils, "showInputBox").resolves(remoteDir);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window

        await new VaultAddCommand().run();
      });

      test("THEN the vault is under `dependencies/remote`, and is self contained", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        // It's kinda hard to mock git cloning from a remote here, so the remote
        // we're using is a directory. Because of that, the name of the vault
        // will fall back to the directory name.
        const vaultPath = path.join(wsRoot, FOLDERS.DEPENDENCIES, vaultName);
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
    "WHEN adding a remote self contained vault with transitive deps",
    { modConfigCb: enableSelfCOntainedVaults },
    () => {
      let vaultName: string;
      let remoteDir: string;
      let transitiveDir: string;
      let showMessageStub: SinonStubbedFn<typeof VSCodeUtils["showMessage"]>;
      before(async () => {
        // Create two self contained vaults with git. Add the first one into the second one.
        // The first vault becomes a transitive dependency.
        transitiveDir = tmpDir().name;
        await createSelfContainedVaultWithGit(transitiveDir);
        remoteDir = tmpDir().name;
        await createSelfContainedVaultWithGit(remoteDir);
        const wsService = new WorkspaceService({ wsRoot: remoteDir });
        await wsService.createSelfContainedVault({
          addToConfig: true,
          addToCodeWorkspace: true,
          newVault: true,
          vault: {
            fsPath: "transitive",
            selfContained: true,
            remote: {
              type: "git",
              url: transitiveDir,
            },
          },
        });
        wsService.dispose();
        const git = new Git({
          localUrl: remoteDir,
        });
        await git.addAll();
        await git.commit({ msg: "add transitive dep" });

        vaultName = path.basename(remoteDir);

        // Now, run the command to add the second vault into the current
        // workspace. It should add the second vault, but prompt that the first
        // vault won't be added because we don't support transitive
        // dependencies.
        showMessageStub = sinon
          .stub(VSCodeUtils, "showMessage")
          .resolves({ title: "" });
        sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
        sinon.stub(VSCodeUtils, "showInputBox").resolves(remoteDir);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window

        await new VaultAddCommand().run();
      });

      test("THEN the vault is under `dependencies/remote`, and is self contained", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        // It's kinda hard to mock git cloning from a remote here, so the remote
        // we're using is a directory. Because of that, the name of the vault
        // will fall back to the directory name.
        const vaultPath = path.join(wsRoot, FOLDERS.DEPENDENCIES, vaultName);
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
        // vaults always use unix separators in config files. Added in #3096
        expect(vault?.fsPath).toEqual(
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

      test("THEN we prompted the user that the transitive dependency is not supported", async () => {
        // Called once to prompt the user that the transitive dependency is not supported
        expect(showMessageStub.calledOnce).toBeTruthy();
      });
    }
  );

  runTestButSkipForWindows()("", () => {
    describeSingleWS(
      "WHEN creating and adding a remote vault inside a native workspace",
      {
        modConfigCb: enableSelfCOntainedVaults,
        workspaceType: WorkspaceType.NATIVE,
      },
      () => {
        let remoteDir: string;
        let vaultName: string;
        before(async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const tmpVaultPath = "tmp";
          remoteDir = path.join(wsRoot, tmpVaultPath);
          await createSelfContainedVaultWithGit(remoteDir);
          vaultName = path.basename(remoteDir);

          sinon
            .stub(VSCodeUtils, "showQuickPick")
            .resolves({ label: "remote" });
          sinon.stub(VSCodeUtils, "showInputBox").resolves(remoteDir);
          sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window

          await new VaultAddCommand().run();
        });

        test("THEN the vault is under `dependencies/remote`, and is self contained", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          // It's kinda hard to mock git cloning from a remote here, so the remote
          // we're using is a directory. That means this looks like
          // `dependencies/tmp-123-foo` which is not "up to spec" but it's a good
          // fallback behavior
          const vaultPath = path.join(wsRoot, FOLDERS.DEPENDENCIES, vaultName);
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

  describeSingleWS(
    "WHEN creating and adding a remote workspace vault",
    { modConfigCb: enableSelfCOntainedVaults, timeout: 5e3 },
    () => {
      let vaultName: string;
      let remoteDir: string;
      before(async () => {
        // Create a self contained vault outside the current workspace
        remoteDir = tmpDir().name;
        await createWorkspaceWithGit(remoteDir);
        vaultName = path.basename(remoteDir);

        sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
        sinon.stub(VSCodeUtils, "showInputBox").resolves(remoteDir);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window

        await new VaultAddCommand().run();
      });

      test("THEN the vault is under `dependencies/remote`, and is a workspace vault", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        // It's kinda hard to mock git cloning from a remote here, so the remote
        // we're using is a directory. Because of that, the name of the vault
        // will fall back to the directory name.
        const vaultPath = path.join(wsRoot, vaultName);
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
    "WHEN creating and adding a remote regular (non self contained) vault",
    { modConfigCb: enableSelfCOntainedVaults },
    () => {
      let vaultName: string;
      let remoteDir: string;
      before(async () => {
        // Create a self contained vault outside the current workspace
        remoteDir = tmpDir().name;
        await createVaultWithGit(remoteDir);
        vaultName = path.basename(remoteDir);

        sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
        sinon.stub(VSCodeUtils, "showInputBox").resolves(remoteDir);
        sinon.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window

        await new VaultAddCommand().run();
      });

      test("THEN the vault is under `dependencies/remote`, and is a regular vault", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        // It's kinda hard to mock git cloning from a remote here, so the remote
        // we're using is a directory. Because of that, the name of the vault
        // will fall back to the directory name.
        const vaultPath = path.join(wsRoot, FOLDERS.DEPENDENCIES, vaultName);
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
