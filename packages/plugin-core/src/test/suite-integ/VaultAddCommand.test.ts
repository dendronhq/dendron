import {
  DendronConfig,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  note2File,
  readYAML,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import {
  VaultAddCommand,
  VaultRemoteSource,
} from "../../commands/VaultAddCommand";
import { WorkspaceSettings } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import {
  DENDRON_REMOTE,
  getConfig,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";
import { sinon } from "@dendronhq/common-test-utils";

const stubVaultInput = (opts: {
  cmd?: VaultAddCommand;
  sourceType: VaultRemoteSource;
  sourcePath: string;
  sourceName?: string;
}): void => {
  if (opts.cmd) {
    sinon.stub(opts.cmd, "gatherInputs").returns(
      Promise.resolve({
        type: opts.sourceType,
        name: opts.sourceName,
        path: opts.sourcePath,
      })
    );
  }

  let acc = 0;
  // @ts-ignore
  VSCodeUtils.showQuickPick = async () => ({ label: opts.sourceType });

  VSCodeUtils.showInputBox = async () => {
    if (acc === 0) {
      acc += 1;
      return opts.sourcePath;
    } else if (acc === 1) {
      acc += 1;
      return opts.sourceName;
    } else {
      throw Error("exceed acc limit");
    }
  };
  return;
};

const getWorkspaceFolders = () => {
  const wsPath = DendronWorkspace.workspaceFile().fsPath;
  const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
  return _.toArray(settings.folders);
};

suite("VaultAddCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
    afterHook: () => {
      sinon.restore();
    },
  });

  describe("remote", function () {
    test("basic, no gitignore", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          const cmd = new VaultAddCommand();
          const remote = "https://github.com/dendronhq/dendron-site-vault.git";
          stubVaultInput({
            cmd,
            sourceType: "remote",
            sourcePath: remote,
            sourceName: "dendron",
          });
          const resp = await cmd.run();
          const newVault = resp!.vaults[0];
          expect(resp!.vaults).toEqual([
            {
              fsPath: "repos/dendron-site-vault",
              remote: {
                type: "git",
                url: remote,
              },
            },
          ]);
          const config = getConfig({ wsRoot });
          expect(config.vaults).toEqual([vault, resp!.vaults[0]]);
          const wsFolders = getWorkspaceFolders();
          expect(wsFolders).toEqual([
            { path: vault.fsPath },
            { path: newVault.fsPath },
          ]);
          expect(fs.existsSync(path.join(wsRoot, ".gitignore"))).toBeFalsy();
          done();
        },
      });
    });

    test("basic, gitignore", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const gitIgnore = path.join(wsRoot, ".gitignore");
          fs.writeFileSync(gitIgnore, "foo\n");
          const vault = vaults[0];
          const cmd = new VaultAddCommand();
          const remote = DENDRON_REMOTE;
          stubVaultInput({
            cmd,
            sourceType: "remote",
            sourcePath: remote,
            sourceName: "dendron",
          });
          const resp = await cmd.run();
          const newVault = resp!.vaults[0];
          expect(resp!.vaults).toEqual([
            {
              fsPath: "repos/dendron-site-vault",
              remote: {
                type: "git",
                url: remote,
              },
            },
          ]);
          const config = getConfig({ wsRoot });
          expect(config.vaults).toEqual([vault, resp!.vaults[0]]);
          const wsFolders = getWorkspaceFolders();
          expect(wsFolders).toEqual([
            { path: vault.fsPath },
            { path: newVault.fsPath },
          ]);
          expect(fs.existsSync(gitIgnore)).toBeTruthy();
          expect(fs.readFileSync(gitIgnore, { encoding: "utf8" })).toEqual(
            "foo\nrepos/dendron-site-vault\n"
          );
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

          const note = NoteUtilsV2.createRoot({
            vault: { fsPath: vpath },
            body: ["existing note"].join("\n"),
          });
          await note2File({ note, vault, wsRoot });
          const schema = SchemaUtilsV2.createRootModule({ vault });
          await schemaModuleOpts2File(schema, vault.fsPath, "root");
        },
        onInit: async ({ vault, wsRoot }) => {
          const vpath = path.join(wsRoot, "vault2");
          stubVaultInput({ sourceType: "local", sourcePath: vpath });
          await new VaultAddCommand().run();
          assert.deepStrictEqual(fs.readdirSync(vpath), [
            "root.md",
            "root.schema.yml",
          ]);
          const configPath = DConfig.configPath(
            DendronWorkspace.wsRoot() as string
          );
          const config = readYAML(configPath) as DendronConfig;
          assert.deepStrictEqual(
            config.vaults.map((ent) => ent.fsPath),
            [vault.fsPath, "vault2"]
          );
          const wsPath = DendronWorkspace.workspaceFile().fsPath;
          const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
          assert.deepStrictEqual(settings.folders, [
            { path: vault.fsPath },
            { path: "vault2" },
          ]);

          const body = fs.readFileSync(path.join(vpath, "root.md"));
          assert.ok(body.indexOf("existing note") >= 0);
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
          assert.deepStrictEqual(fs.readdirSync(vpath), [
            "root.md",
            "root.schema.yml",
          ]);
          const configPath = DConfig.configPath(
            DendronWorkspace.wsRoot() as string
          );
          const config = readYAML(configPath) as DendronConfig;
          assert.deepStrictEqual(
            config.vaults.map((ent) => ent.fsPath),
            [vault.fsPath, "vault2"]
          );
          const wsPath = DendronWorkspace.workspaceFile().fsPath;
          const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
          assert.deepStrictEqual(settings.folders, [
            { path: vault.fsPath },
            { path: "vault2" },
          ]);
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
          assert.deepStrictEqual(fs.readdirSync(vpath), [
            "root.md",
            "root.schema.yml",
          ]);
          const configPath = DConfig.configPath(
            DendronWorkspace.wsRoot() as string
          );
          const config = readYAML(configPath) as DendronConfig;
          assert.deepStrictEqual(
            config.vaults.map((ent) => ent.fsPath),
            [vault.fsPath, sourcePath]
          );
          const wsPath = DendronWorkspace.workspaceFile().fsPath;
          const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
          assert.deepStrictEqual(settings.folders, [
            { path: vault.fsPath },
            { path: sourcePath },
          ]);
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
          assert.deepStrictEqual(fs.readdirSync(vpath), [
            "root.md",
            "root.schema.yml",
          ]);
          const configPath = DConfig.configPath(
            DendronWorkspace.wsRoot() as string
          );
          const config = readYAML(configPath) as DendronConfig;
          assert.deepStrictEqual(
            config.vaults.map((ent) => ent.fsPath),
            [vault.fsPath, vaultRelPath]
          );
          const wsPath = DendronWorkspace.workspaceFile().fsPath;
          const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
          assert.deepStrictEqual(settings.folders, [
            { path: vault.fsPath },
            { path: vaultRelPath },
          ]);
          done();
        },
      });
    });
  });
});
