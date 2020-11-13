import { DendronConfig, Time } from "@dendronhq/common-all";
import { DirResult, readYAML, tmpDir } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import {
  DConfig,
  getPortFilePath,
  getWSMetaFilePath,
  openWSMetaFile,
} from "@dendronhq/engine-server";
import * as assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach, describe, it } from "mocha";
import path from "path";
import { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { WORKSPACE_STATE } from "../../constants";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import { onExtension, onWSInit, setupDendronWorkspace } from "../testUtils";
import { setupCodeWorkspaceV2 } from "../testUtilsv2";

const TIMEOUT = 60 * 1000 * 5;

suite("startup with lsp", function () {
  this.timeout(TIMEOUT);
  let ctx: ExtensionContext;
  let root: DirResult;
  let vaultPath: string;

  describe("workspace", function () {
    beforeEach(async function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
      await new ResetConfigCommand().execute({ scope: "all" });
      root = tmpDir();
    });

    afterEach(function () {
      HistoryService.instance().clearSubscriptions();
    });

    // update test for partial failure
    it.skip("workspace active, bad schema", function (done) {
      onExtension({
        action: "not_initialized",
        cb: async (_event: HistoryEvent) => {
          const client = DendronWorkspace.instance().getEngine();
          assert.deepStrictEqual(client.notes, {});
          done();
        },
      });

      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
          fs.writeFileSync(
            path.join(vaultPath, "bond.schema.yml"),
            `
id: bond
`
          );
        },
      });
    });

    it("upgrade config", function (done) {
      DendronWorkspace.version = () => "0.0.1";
      setupCodeWorkspaceV2({
        ctx,
        postSetupHook: async ({ wsRoot }) => {
          fs.removeSync(DConfig.configPath(wsRoot));
          await DConfig.getOrCreate(wsRoot);
        },
      }).then(({ vaults }) => {
        onExtension({
          action: "activate",
          cb: async (_event: HistoryEvent) => {
            assert.strictEqual(DendronWorkspace.isActive(), true);
            assert.strictEqual(
              ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
              "0.0.1"
            );
            const engine = DendronWorkspace.instance().getEngine();
            const wsRoot = DendronWorkspace.rootDir() as string;
            // check for config file
            const config = readYAML(
              DConfig.configPath(wsRoot)
            ) as DendronConfig;

            // cehck that config was upgraded using relative file
            assert.deepStrictEqual(config.vaults, [
              { fsPath: path.basename(vaults[0]) },
            ]);

            // check for meta
            const port = getPortFilePath({ wsRoot });
            const fpath = getWSMetaFilePath({ wsRoot });
            const meta = openWSMetaFile({ fpath });
            assert.ok(
              _.toInteger(fs.readFileSync(port, { encoding: "utf8" })) > 0
            );
            assert.strictEqual(meta.version, "0.0.1");
            assert.ok(meta.activationTime < Time.now().toMillis());
            assert.strictEqual(_.values(engine.notes).length, 1);
            assert.deepStrictEqual(fs.readdirSync(vaults[0]).sort(), [
              ".git",
              ".vscode",
              "assets",
              "root.md",
              "root.schema.yml",
            ]);
            done();
          },
        });
        _activate(ctx);
      });
    });

    it("workspace active, no prior workspace version", function (done) {
      onExtension({
        action: "activate",
        cb: async (_event: HistoryEvent) => {
          assert.strictEqual(DendronWorkspace.isActive(), true);
          assert.strictEqual(
            ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
            "0.0.1"
          );
          const engine = DendronWorkspace.instance().getEngine();
          const wsRoot = DendronWorkspace.rootDir() as string;
          // check for config file
          const config = readYAML(DConfig.configPath(wsRoot)) as DendronConfig;
          assert.deepStrictEqual(config.vaults, [{ fsPath: vaultPath }]);

          // check for meta
          const port = getPortFilePath({ wsRoot });
          const fpath = getWSMetaFilePath({ wsRoot });
          const meta = openWSMetaFile({ fpath });
          assert.ok(
            _.toInteger(fs.readFileSync(port, { encoding: "utf8" })) > 0
          );
          assert.strictEqual(meta.version, "0.0.1");
          assert.ok(meta.activationTime < Time.now().toMillis());
          assert.strictEqual(_.values(engine.notes).length, 1);
          assert.deepStrictEqual(fs.readdirSync(vaultPath).sort(), [
            ".vscode",
            "root.md",
            "root.schema.yml",
          ]);
          done();
        },
      });

      DendronWorkspace.version = () => "0.0.1";
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (_vaultPath) => {
          vaultPath = _vaultPath;
        },
      });
    });

    it("missing root.schema", function (done) {
      onWSInit(async (_event: HistoryEvent) => {
        assert.strictEqual(DendronWorkspace.isActive(), true);
        assert.strictEqual(
          ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
          "0.0.1"
        );
        const engine = DendronWorkspace.instance().getEngine();
        assert.strictEqual(_.values(engine.notes).length, 1);
        // assert.strictEqual(engine.notes["id.foo"].fname, "foo");
        // assert.strictEqual(engine.notes["root"].fname, "root");
        assert.deepStrictEqual(fs.readdirSync(vaultPath).sort(), [
          ".vscode",
          "root.md",
          "root.schema.yml",
        ]);
        done();
      });

      DendronWorkspace.version = () => "0.0.1";
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (_vaultPath) => {
          vaultPath = _vaultPath;
          fs.removeSync(path.join(_vaultPath, "root.schema.yml"));
        },
      });
    });
  });
});
