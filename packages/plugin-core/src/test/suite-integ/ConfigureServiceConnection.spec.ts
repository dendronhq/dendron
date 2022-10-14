/* eslint-disable no-undef */
import { writeYAML } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { ExternalService, PodUtils } from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
import sinon from "sinon";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";
import { PodUIControls } from "../../components/pods/PodControls";
import * as vscode from "vscode";
import { ConfigureServiceConnection } from "../../commands/pods/ConfigureServiceConnection";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describe } from "mocha";

suite("ConfigureServiceConnection", function () {
  const ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });
  describe("GIVEN Configure Service Connection command is run", () => {
    describeMultiWS(
      "WHEN Create New option is selected",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN new service config must be created", async () => {
          const cmd = new ConfigureServiceConnection(
            ExtensionProvider.getExtension()
          );
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
        });
      }
    );

    describeMultiWS(
      "AND WHEN a service connection Id is selected",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN service config of selected connection Id must open", async () => {
          const cmd = new ConfigureServiceConnection(
            ExtensionProvider.getExtension()
          );
          sinon.stub(vscode.window, "showQuickPick").returns(
            Promise.resolve({
              label: "airtable-2",
            }) as Thenable<vscode.QuickPickItem>
          );
          //setup
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const configPath = PodUtils.getServiceConfigPath({
            wsRoot,
            connectionId: "airtable-2",
          });
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
        });
      }
    );
  });
});
