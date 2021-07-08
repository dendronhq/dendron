import { CONSTANTS, Time } from "@dendronhq/common-all";
import {
  getPortFilePath,
  getWSMetaFilePath,
  openWSMetaFile,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { describe, it } from "mocha";
import path from "path";
import { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { DendronWorkspace, resolveRelToWSRoot } from "../../workspace";
import { expect, genDefaultSettings, genEmptyWSFiles } from "../testUtilsv2";
import { runLegacySingleWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("SetupWorkspace", () => {
  let ctx: ExtensionContext;

  describe("workspace", function () {
    ctx = setupBeforeAfter(this, {
      beforeHook: async () => {
        await new ResetConfigCommand().execute({ scope: "all" });
      },
    });

    // update test for partial failure

    it("basic", (done) => {
      DendronWorkspace.version = () => "0.0.1";
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults, engine }) => {
          // check for meta
          const port = getPortFilePath({ wsRoot });
          const fpath = getWSMetaFilePath({ wsRoot });
          const meta = openWSMetaFile({ fpath });
          expect(
            _.toInteger(fs.readFileSync(port, { encoding: "utf8" })) > 0
          ).toBeTruthy();
          expect(meta.version).toEqual("0.0.1");
          expect(meta.activationTime < Time.now().toMillis()).toBeTruthy();
          expect(_.values(engine.notes).length).toEqual(1);
          const vault = resolveRelToWSRoot(vaults[0].fsPath);

          const settings = fs.readJSONSync(
            path.join(wsRoot, "dendron.code-workspace")
          );
          expect(settings).toEqual(genDefaultSettings());
          expect(fs.readdirSync(vault)).toEqual(
            [CONSTANTS.DENDRON_CACHE_FILE].concat(genEmptyWSFiles())
          );
          done();
        },
      });
    });

    it("missing root.schema", (done) => {
      DendronWorkspace.version = () => "0.0.1";
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ vaults }) => {
          const vault = resolveRelToWSRoot(vaults[0].fsPath);
          expect(fs.readdirSync(vault)).toEqual(
            [CONSTANTS.DENDRON_CACHE_FILE].concat(genEmptyWSFiles())
          );
          done();
        },
        postSetupHook: async ({ vaults }) => {
          fs.removeSync(
            path.join(resolveRelToWSRoot(vaults[0].fsPath), "root.schema.yml")
          );
        },
      });
    });
  });
});
