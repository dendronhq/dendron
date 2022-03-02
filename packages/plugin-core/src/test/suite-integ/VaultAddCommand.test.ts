import {
  IntermediateDendronConfig,
  DVault,
  NoteUtils,
  SchemaUtils,
  VaultUtils,
  ConfigUtils,
  FOLDERS,
  CONSTANTS,
} from "@dendronhq/common-all";
import {
  note2File,
  readYAML,
  readYAMLAsync,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { DConfig, Git, WorkspaceService } from "@dendronhq/engine-server";
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
import { getDWorkspace } from "../../workspace";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import {
  describeSingleWS,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
  stubVaultInput,
} from "../testUtilsV3";

suite("VaultAddCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {
      // prevents a ReloadWorkspace
      sinon.stub(vscode.commands, "executeCommand").resolves({});
    },
  });

  // TODO: need to stub git clone with side effects
  describe("remote", () => {
    test("basic", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
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
                  fsPath: "vault",
                  name: "dendron",
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
          done();
        },
      });
    });

    test("add vault inside workspace", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
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

          const config = DConfig.getOrCreate(wsRoot);
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
          done();
        },
      });
    });

    test("add workspace vault with same name as existing vault", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          // create remote repo
          const remoteDir = tmpDir().name;
          const vaultPath = "vault";
          const vaultsRemote: DVault[] = [{ fsPath: vaultPath }];
          await WorkspaceService.createWorkspace({
            wsRoot: remoteDir,
            vaults: vaultsRemote,
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

          const config = DConfig.getOrCreate(wsRoot);
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
                  fsPath: vaultPath,
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
          done();
        },
      });
    });

    describeSingleWS("WHEN vault was already in .gitignore", { ctx }, () => {
      describe("AND vaultAddCommand is run", () => {
        // TODO: This test needs to be fixed
        test.skip("THEN vault is not duplicated", async () => {
          const vaultPath = "vaultRemote";
          const { wsRoot } = getDWorkspace();
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
    test("add to existing folder", (done) => {
      runSingleVaultTest({
        ctx,
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
        onInit: async ({ vault, wsRoot }) => {
          const vpath = path.join(wsRoot, "vault2");
          stubVaultInput({ sourceType: "local", sourcePath: vpath });

          await new VaultAddCommand().run();
          expect(fs.readdirSync(vpath)).toEqual([
            ".gitignore",
            "root.md",
            "root.schema.yml",
          ]);
          expect(
            fs.readFileSync(path.join(vpath, ".gitignore"), {
              encoding: "utf8",
            })
          ).toEqual("\n.dendron.cache.*");
          await checkVaults(
            {
              wsRoot,
              vaults: [
                {
                  fsPath: "vault2",
                },
                vault,
              ],
            },
            expect
          );

          // new file added to newline
          expect(
            await FileTestUtils.assertInFile({
              fpath: path.join(wsRoot, ".gitignore"),
              match: ["\nvault2"],
            })
          ).toBeTruthy();

          // check config
          const config = readYAML(
            path.join(wsRoot, "dendron.yml")
          ) as IntermediateDendronConfig;
          const publishingConfig = ConfigUtils.getPublishingConfig(config);
          expect(publishingConfig.duplicateNoteBehavior).toEqual({
            action: "useVault",
            payload: [VaultUtils.getName(vault), "vault2"],
          });

          // check note is still existing note
          expect(
            await FileTestUtils.assertInFile({
              fpath: path.join(vpath, "root.md"),
              match: ["existing note"],
            })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("add absolute path inside wsRoot", (done) => {
      runSingleVaultTest({
        ctx,
        onInit: async ({ vault, wsRoot }) => {
          const vpath = path.join(wsRoot, "vault2");
          stubVaultInput({ sourceType: "local", sourcePath: vpath });
          await new VaultAddCommand().run();
          expect(fs.readdirSync(vpath)).toEqual([
            ".gitignore",
            "root.md",
            "root.schema.yml",
          ]);
          await checkVaults(
            {
              wsRoot,
              vaults: [
                {
                  fsPath: "vault2",
                },
                vault,
              ],
            },
            expect
          );
          done();
        },
      });
    });

    test("add rel path inside wsRoot", (done) => {
      runSingleVaultTest({
        ctx,
        onInit: async ({ vault, wsRoot }) => {
          const sourcePath = "vault2";
          stubVaultInput({ sourceType: "local", sourcePath });
          await new VaultAddCommand().run();
          const vpath = path.join(wsRoot, sourcePath);
          expect(fs.readdirSync(vpath)).toEqual([
            ".gitignore",
            "root.md",
            "root.schema.yml",
          ]);
          await checkVaults(
            {
              wsRoot,
              vaults: [
                {
                  fsPath: "vault2",
                },
                vault,
              ],
            },
            expect
          );
          done();
        },
      });
    });

    test("add absolute path outside of wsRoot", (done) => {
      runSingleVaultTest({
        ctx,
        onInit: async ({ vault, wsRoot }) => {
          const vpath = tmpDir().name;
          const vaultRelPath = path.relative(wsRoot, vpath);
          stubVaultInput({ sourceType: "local", sourcePath: vpath });
          await new VaultAddCommand().run();
          expect(fs.readdirSync(vpath)).toEqual([
            ".gitignore",
            "root.md",
            "root.schema.yml",
          ]);

          await checkVaults(
            {
              wsRoot,
              vaults: [
                {
                  fsPath: vaultRelPath,
                },
                vault,
              ],
            },
            expect
          );

          done();
        },
      });
    });
  });
});

function enableSelfCOntainedVaults(config: IntermediateDendronConfig) {
  config.dev!.enableSelfContainedVaults = true;
  return config;
}
describe("GIVEN VaultAddCommand with self contained vaults enabled", function () {
  const ctx = setupBeforeAfter(this, {});

  describeSingleWS(
    "WHEN creating and adding a local vault",
    {
      ctx,
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
      });

      test("THEN the vault was added to the workspace config correctly", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const config = DConfig.getOrCreate(wsRoot);
        const vault = VaultUtils.getVaultByName({
          vaults: ConfigUtils.getVaults(config),
          vname: vaultName,
        });
        expect(vault?.selfContained).toBeTruthy();
        expect(vault?.name).toEqual(vaultName);
        expect(vault?.fsPath).toEqual(
          path.join(FOLDERS.DEPENDENCIES, FOLDERS.LOCAL_DEPENDENCY, vaultName)
        );
      });

      test("THEN the notes in this vault are accessible", async () => {
        // Since we mock the reload window, need to reload index here to pick up the notes in the new vault
        await new ReloadIndexCommand().run();
        const { engine, vaults } = ExtensionProvider.getDWorkspace();
        const vault = VaultUtils.getVaultByName({
          vaults,
          vname: vaultName,
        });
        expect(vault).toBeTruthy();
        const note = NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vault!,
          engine,
        });
        expect(note).toBeTruthy();
        expect(note?.vault.name).toEqual(vaultName);
      });
    }
  );

  describeSingleWS(
    "WHEN creating and adding a remote vault",
    { ctx, modConfigCb: enableSelfCOntainedVaults },
    () => {
      let remoteDir: string;
      let vaultName: string;
      before(async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const tmpVaultPath = "tmp";
        remoteDir = path.join(wsRoot, tmpVaultPath);
        vaultName = path.basename(remoteDir);
        const ws = new WorkspaceService({ wsRoot });
        // Create a vault inside the WS but don't add it to the WS. This is a
        // workaround because we can't create a vault without a workspace yet.
        await ws.createSelfContainedVault({
          vault: {
            fsPath: tmpVaultPath,
            selfContained: true,
          },
          addToConfig: false,
          addToCodeWorkspace: false,
        });
        const git = new Git({ localUrl: remoteDir });
        git.init();
        git.addAll();
        git.commit({ msg: "start" });

        sinon.stub(VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
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
          await readYAMLAsync(
            path.join(vaultPath, CONSTANTS.DENDRON_CONFIG_FILE)
          )
        ).toBeTruthy();
      });

      test("THEN the vault was added to the workspace config correctly", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const config = DConfig.getOrCreate(wsRoot);
        const vault = VaultUtils.getVaultByName({
          vaults: ConfigUtils.getVaults(config),
          vname: vaultName,
        });
        expect(vault?.selfContained).toBeTruthy();
        expect(vault?.name).toEqual(vaultName);
        expect(vault?.fsPath).toEqual(
          path.join(FOLDERS.DEPENDENCIES, vaultName)
        );
      });

      test("THEN the notes in this vault are accessible", async () => {
        // Since we mock the reload window, need to reload index here to pick up the notes in the new vault
        await new ReloadIndexCommand().run();
        const { engine, vaults } = ExtensionProvider.getDWorkspace();
        const vault = VaultUtils.getVaultByName({
          vaults,
          vname: vaultName,
        });
        expect(vault).toBeTruthy();
        const note = NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vault!,
          engine,
        });
        expect(note).toBeTruthy();
        expect(note?.vault.name).toEqual(vaultName);
      });
    }
  );
});
