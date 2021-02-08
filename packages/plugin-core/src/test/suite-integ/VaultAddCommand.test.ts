import {
  NoteUtilsV2,
  SchemaUtilsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  note2File,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import { FileTestUtils, sinon } from "@dendronhq/common-test-utils";
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
import { WorkspaceFolderRaw, WorkspaceSettings } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import {
  DENDRON_REMOTE,
  getConfig,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

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

function checkVaults(opts: WorkspaceOpts) {
  const { wsRoot, vaults } = opts;
  const config = getConfig({ wsRoot });
  expect(config.vaults).toEqual(vaults);
  const wsFolders = getWorkspaceFolders();
  expect(wsFolders).toEqual(
    vaults.map((ent) => {
      const out: WorkspaceFolderRaw = { path: ent.fsPath };
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
    beforeHook: () => {},
    afterHook: () => {
      sinon.restore();
    },
  });

  describe("remote", function () {
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

          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: newVault.fsPath,
                name: "dendron",
                remote: {
                  type: "git",
                  url: remote,
                },
              },
              vault,
            ],
          });
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
    test.only("add to existing folder", (done) => {
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

          checkVaults({
            wsRoot,
            vaults: [
              {
                fsPath: "vault2",
              },
              vault,
            ],
          });
          expect(
            FileTestUtils.assertInFile({
              fpath: path.join(wsRoot, ".gitignore"),
              match: ["\nvault2"],
            })
          ).toBeTruthy();
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
          assert.deepStrictEqual(fs.readdirSync(vpath), [
            "root.md",
            "root.schema.yml",
          ]);
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
          assert.deepStrictEqual(fs.readdirSync(vpath), [
            "root.md",
            "root.schema.yml",
          ]);

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
