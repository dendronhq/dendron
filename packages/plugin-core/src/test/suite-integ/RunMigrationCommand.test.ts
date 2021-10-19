import _ from "lodash";
import {
  ConfigUtils,
  IntermediateDendronConfig,
  WorkspaceType,
} from "@dendronhq/common-all";
import sinon from "sinon";
import * as vscode from "vscode";
import { RunMigrationCommand } from "../../commands/RunMigrationCommand";
import { CONFIG } from "../../constants";
import { getDWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { DConfig } from "@dendronhq/engine-server";

suite("RunMigrationCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      modConfigCb: (config) => {
        // @ts-ignore
        delete config.commands["lookup"];
        return config;
      },
      wsSettingsOverride: {
        settings: {
          [CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key]: "selection2link",
        },
      },
      onInit: async ({ wsRoot }) => {
        const cmd = new RunMigrationCommand();
        // testing for explicitly delete key.
        const rawConfig = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;
        expect(_.isUndefined(rawConfig.commands?.lookup)).toBeTruthy();
        sinon.stub(cmd, "gatherInputs").resolves({ version: "0.55.2" });
        const out = await cmd.run();
        expect(out!.length).toEqual(1);
        expect(out![0].data.version === "0.55.2");
        const config = getDWorkspace().config;
        const lookupConfig = ConfigUtils.getLookup(config);
        expect(lookupConfig.note.selectionMode).toEqual("link");
        done();
      },
      workspaceType: WorkspaceType.CODE,
    });
  });
});
