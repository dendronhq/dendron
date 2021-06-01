import {
  DendronConfig,
  DVault,
  DWorkspace,
  NoteUtils,
  SchemaUtils,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  note2File,
  readYAML,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import { FileTestUtils, sinon } from "@dendronhq/common-test-utils";
import { DConfig, WorkspaceService } from "@dendronhq/engine-server";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VaultAddCommand } from "../../commands/VaultAddCommand";
import { WorkspaceFolderRaw, WorkspaceSettings } from "../../types";
import { DendronWorkspace } from "../../workspace";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import {
  getConfig,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
  stubVaultInput,
} from "../testUtilsV3";

const getWorkspaceFolders = () => {
  const wsPath = DendronWorkspace.workspaceFile().fsPath;
  const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
  return _.toArray(settings.folders);
};

function checkVaults(opts: WorkspaceOpts) {
  const { wsRoot, vaults } = opts;
  const config = getConfig({ wsRoot });
  expect(config.vaults).toEqual(vaults);
  const wsFolders = getWorkspaceFolders();
  expect(wsFolders).toEqual(
    vaults.map((ent) => {
      const out: WorkspaceFolderRaw = { path: VaultUtils.getRelPath(ent) };
      if (ent.name) {
        out.name = ent.name;
      }
      return out;
    })
  );
}

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
          const remote = remoteDir;
          stubVaultInput({
            cmd,
            sourceType: "remote",
            sourcePath: "vaultRemote",
            sourcePathRemote: remoteDir,
            sourceName: "dendron",
          });
          const resp = await cmd.run();
          const newVault = resp!.vaults[0];

          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: newVault.fsPath,
                name: "dendron",
                remote: {
                  type: "git" as const,
                  url: remote,
                },
              },
              vaults[0],
            ],
          });
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
          // create remote repo
          const remoteDir = tmpDir().name;
          const vaultsRemote: DVault[] = [{ fsPath: "vault1" }];
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
          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: "vault1",
                workspace: wsName,
                name: "dendron",
              },
              vaults[0],
            ],
          });
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
          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: vaultPath,
                workspace: wsName,
                name: "dendron",
              },
              vaults[0],
            ],
          });
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

          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: "vault2",
              },
              vault,
            ],
          });

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
          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: "vault2",
              },
              vault,
            ],
          });
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
          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: "vault2",
              },
              vault,
            ],
          });
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

          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: vaultRelPath,
              },
              vault,
            ],
          });

          done();
        },
      });
    });
  });
});
