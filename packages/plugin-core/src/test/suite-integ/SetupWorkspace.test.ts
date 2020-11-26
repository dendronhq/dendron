import { DendronConfig, Time } from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";
import {
  DConfig,
  getPortFilePath,
  getWSMetaFilePath,
  openWSMetaFile,
} from "@dendronhq/engine-server";
import * as assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { describe, it } from "mocha";
import path from "path";
import { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { InitializeType } from "../../commands/SetupWorkspace";
import { DEFAULT_LEGACY_VAULT_NAME } from "../../constants";
import { DendronWorkspace, resolveRelToWSRoot } from "../../workspace";
import {
  expect,
  genDefaultSettings,
  genEmptyWSFiles,
  runWorkspaceTestV3,
  stubWorkspaceFolders,
} from "../testUtilsv2";
import { runLegacySingleWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("SetupWorkspace", function () {
  let ctx: ExtensionContext;

  describe("workspace", function () {
    ctx = setupBeforeAfter(this, {
      beforeHook: async () => {
        await new ResetConfigCommand().execute({ scope: "all" });
      },
    });

    // update test for partial failure

    it("basic", function (done) {
      DendronWorkspace.version = () => "0.0.1";
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults, engine }) => {
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
          const vault = resolveRelToWSRoot(vaults[0].fsPath);

          const settings = fs.readJSONSync(
            path.join(wsRoot, "dendron.code-workspace")
          );
          expect(settings).toEqual(genDefaultSettings());
          expect(fs.readdirSync(vault)).toEqual(genEmptyWSFiles());
          done();
        },
      });
    });

    it("migrate config, empty vaults", function (done) {
      DendronWorkspace.version = () => "0.0.1";
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          // check for config file
          const config = readYAML(DConfig.configPath(wsRoot)) as DendronConfig;
          expect(config.vaults).toEqual(vaults);
          done();
        },
        preSetupHook: async ({ wsRoot }) => {
          const vaults = [
            { fsPath: path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME) },
          ];
          stubWorkspaceFolders(vaults);
        },
        postSetupHook: async ({ wsRoot }) => {
          fs.removeSync(DConfig.configPath(wsRoot));
          DConfig.getOrCreate(wsRoot);
        },
      });
    });

    it("missing root.schema", function (done) {
      DendronWorkspace.version = () => "0.0.1";
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ vaults }) => {
          const vault = resolveRelToWSRoot(vaults[0].fsPath);
          expect(fs.readdirSync(vault)).toEqual(genEmptyWSFiles());
          done();
        },
        postSetupHook: async ({ vaults }) => {
          fs.removeSync(
            path.join(resolveRelToWSRoot(vaults[0].fsPath), "root.schema.yml")
          );
        },
      });
    });

    it.skip("with template", function (done) {
      runWorkspaceTestV3({
        ctx,
        setupWsOverride: {
          skipConfirmation: true,
          emptyWs: false,
          initType: InitializeType.TEMPLATE,
          skipOpenWs: true,
        },
        onInit: async ({ wsRoot }) => {
          const dendronRoot = path.join(wsRoot);
          expect(fs.existsSync(dendronRoot)).toEqual(true);
          done();
        },
      });
    });
  });
});
