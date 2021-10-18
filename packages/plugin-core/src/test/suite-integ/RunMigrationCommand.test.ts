import _ from "lodash";
import { WorkspaceType } from "@dendronhq/common-all";
import sinon from "sinon";
import * as vscode from "vscode";
import { RunMigrationCommand } from "../../commands/RunMigrationCommand";
import { CONFIG } from "../../constants";
import { getDWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("RunMigrationCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      modConfigCb: (config) => {
        // @ts-ignore
        delete config.commands!.lookup;
        return config;
      },
      wsSettingsOverride: {
        settings: {
          [CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key]: "selection2link",
        },
      },
      onInit: async ({ engine }) => {
        const cmd = new RunMigrationCommand();
        expect(_.isUndefined(engine.config.commands!.lookup)).toBeTruthy();
        sinon.stub(cmd, "gatherInputs").resolves({ version: "0.55.2" });
        const out = await cmd.run();
        expect(out!.length).toEqual(1);
        expect(out![0].data.version === "0.55.2");
        expect(
          getDWorkspace().config.commands!.lookup.note.selectionMode
        ).toEqual("link");
        done();
      },
      workspaceType: WorkspaceType.CODE,
    });
  });
});
