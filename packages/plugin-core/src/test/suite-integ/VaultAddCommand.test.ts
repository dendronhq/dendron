import { DendronConfig } from "@dendronhq/common-all";
import { readYAML, tmpDir } from "@dendronhq/common-server";
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

  // TODO: need to update DendronWorkspace to have proper settings in path
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
          DendronWorkspace.rootDir() as string
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
