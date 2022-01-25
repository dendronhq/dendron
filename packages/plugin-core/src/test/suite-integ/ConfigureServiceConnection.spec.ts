import { writeYAML } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { ExternalService } from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
import sinon from "sinon";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { PodUIControls } from "../../components/pods/PodControls";
import * as vscode from "vscode";
import { getExtension } from "../../workspace";
import { ConfigureServiceConnection } from "../../commands/pods/ConfigureServiceConnection";
import { describe } from "mocha";

suite("ConfigureServiceConnection", function () {
  const ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });

  describe("WHEN ConfigureServiceConnection is run with Create New option", () => {
    test("THEN new service config must be created", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async () => {
          const cmd = new ConfigureServiceConnection();
          sinon.stub(vscode.window, "showQuickPick").returns(
            Promise.resolve({
              label: "Create New Service Connection",
            }) as Thenable<vscode.QuickPickItem>
          );
          const serviceType = ExternalService.Airtable;
          sinon
            .stub(PodUIControls, "promptForExternalServiceType")
            .returns(Promise.resolve(serviceType));
          sinon
            .stub(PodUIControls, "promptForGenericId")
            .returns(Promise.resolve("airtable"));
          await cmd.run();
          const activePath =
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
          expect(
            activePath?.endsWith(
              path.join("pods", "service-connections", "svcconfig.airtable.yml")
            )
          ).toBeTruthy();
          done();
        },
      });
    });
  });

  describe("WHEN service config are present", () => {
    test("THEN service config of selected connection Id must open ", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async () => {
          const cmd = new ConfigureServiceConnection();
          sinon.stub(vscode.window, "showQuickPick").returns(
            Promise.resolve({
              label: "airtable-2",
            }) as Thenable<vscode.QuickPickItem>
          );
          //setup
          const configPath = path.join(
            getExtension().podsDir,
            "service-connections",
            "svcconfig.airtable-2.yml"
          );
          ensureDirSync(path.dirname(configPath));
          writeYAML(configPath, {
            serviceType: ExternalService.Airtable,
            podId: "airtable-2",
            connectionId: "test",
          });
          await cmd.run();
          const activePath =
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
          expect(
            activePath?.endsWith(
              path.join(
                "pods",
                "service-connections",
                "svcconfig.airtable-2.yml"
              )
            )
          ).toBeTruthy();
          done();
        },
      });
    });
  });
});
