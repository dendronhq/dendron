import {
  DendronConfig,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  note2File,
  readYAML,
  schemaModuleOpts2File,
} from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import assert from "assert";
import fs from "fs-extra";
import { afterEach, beforeEach } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VaultAddCommand } from "../../commands/VaultAddCommand";
import { HistoryService } from "../../services/HistoryService";
import { WorkspaceSettings } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { runSingleVaultTest } from "../testUtilsv2";

suite("VaultAddCommand", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

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
        let acc = 0;

        // need to ignore to keep compiler from complaining
        // @ts-ignore
        VSCodeUtils.showInputBox = () => {
          if (acc === 0) {
            acc += 1;
            return vpath;
          } else {
            return;
          }
        };

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

  test("add absolute path", (done) => {
    runSingleVaultTest({
      ctx,
      onInit: async ({ vault, wsRoot }) => {
        const vpath = path.join(wsRoot, "vault2");
        let acc = 0;

        // need to ignore to keep compiler from complaining
        // @ts-ignore
        VSCodeUtils.showInputBox = () => {
          if (acc === 0) {
            acc += 1;
            return vpath;
          } else {
            return;
          }
        };

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
});
