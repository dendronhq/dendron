import {
  DendronConfig,
  DVault,
  NoteUtils,
  SchemaUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  note2File,
  readYAML,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import { FileTestUtils, sinon } from "@dendronhq/common-test-utils";
import { DConfig, WorkspaceService } from "@dendronhq/engine-server";
import {
  checkVaults,
  GitTestUtils,
  setupWS,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VaultAddCommand } from "../../commands/VaultAddCommand";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import {
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
  stubVaultInput,
} from "../testUtilsV3";

suite("VaultAddCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      // prevents a ReloadWorkspace
      sinon
        .stub(vscode.commands, "executeCommand")
        .returns(Promise.resolve({}));
    },
    afterHook: () => {
      sinon.restore();
    },
  });

  // TODO: need to stub git clone with side effects
  describe("remote", function () {
    test("basic", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;

          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          const gitIgnore = path.join(wsRoot, ".gitignore");

          const cmd = new VaultAddCommand();
          stubVaultInput({
            cmd,
            sourceType: "remote",
            sourcePath: "vaultRemote",
            sourcePathRemote: remoteDir,
            sourceName: "dendron",
          });
          await cmd.run();

          checkVaults(
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
            FileTestUtils.assertInFile({
              fpath: gitIgnore,
              match: ["vaultRemote"],
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

          expect(DConfig.getOrCreate(wsRoot).workspaces).toEqual({
            [wsName]: {
              remote: {
                type: "git",
                url: remoteDir,
              },
            },
          });
          checkVaults(
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
            FileTestUtils.assertInFile({
              fpath: gitIgnore,
              match: [wsName],
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

          expect(DConfig.getOrCreate(wsRoot).workspaces).toEqual({
            [wsName]: {
              remote: {
                type: "git",
                url: remoteDir,
              },
            },
          });
          checkVaults(
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
            FileTestUtils.assertInFile({
              fpath: gitIgnore,
              match: [wsName],
            })
          ).toBeTruthy();
          done();
        },
      });
    });
  });

  describe("local", function () {
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
          expect(fs.readdirSync(vpath)).toEqual(["root.md", "root.schema.yml"]);

          checkVaults(
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
            FileTestUtils.assertInFile({
              fpath: path.join(wsRoot, ".gitignore"),
              match: ["\nvault2"],
            })
          ).toBeTruthy();

          // check config
          const config = readYAML(
            path.join(wsRoot, "dendron.yml")
          ) as DendronConfig;
          expect(config.site.duplicateNoteBehavior).toEqual({
            action: "useVault",
            payload: [VaultUtils.getName(vault), "vault2"],
          });

          // check note is still existing note
          expect(
            FileTestUtils.assertInFile({
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
          expect(fs.readdirSync(vpath)).toEqual(["root.md", "root.schema.yml"]);
          checkVaults(
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
          expect(fs.readdirSync(vpath)).toEqual(["root.md", "root.schema.yml"]);
          checkVaults(
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
          expect(fs.readdirSync(vpath)).toEqual(["root.md", "root.schema.yml"]);

          checkVaults(
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
