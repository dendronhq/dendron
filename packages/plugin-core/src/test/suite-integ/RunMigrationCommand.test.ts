import * as vscode from "vscode";
import { RunMigrationCommand } from "../../commands/RunMigrationCommand";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import sinon from "sinon";
import _ from "lodash";
import { expect } from "../testUtilsv2";
import { CONFIG } from "../../constants";
import { getWS } from "../../workspace";

suite("RunMigrationCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      modConfigCb: (config) => {
        // @ts-ignore
        delete config.lookup;
        return config;
      },
      wsSettingsOverride: {
        settings: {
          [CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key]: "selection2link"
        }
      },
      onInit: async ({ engine }) => {
        const cmd = new RunMigrationCommand();
        expect(_.isUndefined(engine.config.lookup)).toBeTruthy();
        sinon.stub(cmd, "gatherInputs").resolves({ version: "0.55.2"});
        const out = await cmd.run();
        expect(out!.length).toEqual(1);
        expect(out![0].data.version === "0.55.2");
        expect(getWS().config.lookup.note.selectionType).toEqual("selection2link");
        done();
      }
    });
  });
});