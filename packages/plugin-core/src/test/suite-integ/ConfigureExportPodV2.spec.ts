import { writeYAML } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { PodV2Types } from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
import sinon from "sinon";
import { ConfigureExportPodV2 } from "../../commands/pods/ConfigureExportPodV2";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { PodUIControls } from "../../components/pods/PodControls";
import * as vscode from "vscode";
import { getExtension } from "../../workspace";
import { describe } from "mocha";

suite(" Configure ExportPod V2 ", function () {
  const ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });
  describe("WHEN ConfigureExportV2 is run and there is no config", () => {
    test("THEN a new config is generated for the pod", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async () => {
          const cmd = new ConfigureExportPodV2();
          const podType = PodV2Types.GoogleDocsExportV2;
          cmd.gatherInputs = async () => {
            return { podType };
          };
          sinon
            .stub(PodUIControls, "promptForGenericId")
            .returns(Promise.resolve("foo"));
          await cmd.run();
          const activePath =
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
          expect(
            activePath?.endsWith(path.join("pods", "custom", "config.foo.yml"))
          ).toBeTruthy();
          done();
        },
      });
    });
  });

  describe("WHEN configs are present for selected pod type", () => {
    test("THEN config of selected podId must open", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async () => {
          const cmd = new ConfigureExportPodV2();
          const podType = PodV2Types.MarkdownExportV2;
          cmd.gatherInputs = async () => {
            return { podType };
          };
          sinon
            .stub(vscode.window, "showQuickPick")
            .returns(
              Promise.resolve({
                label: "foobar",
              }) as Thenable<vscode.QuickPickItem>
            );
          //setup
          const configPath = path.join(
            getExtension().podsDir,
            "custom",
            "config.foobar.yml"
          );
          ensureDirSync(path.dirname(configPath));
          writeYAML(configPath, {
            podType: PodV2Types.MarkdownExportV2,
            podId: "foobar",
            exportScope: "Note",
          });

          await cmd.run();
          const activePath =
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
          expect(
            activePath?.endsWith(
              path.join("pods", "custom", "config.foobar.yml")
            )
          ).toBeTruthy();
          done();
        },
      });
    });
  });
});
