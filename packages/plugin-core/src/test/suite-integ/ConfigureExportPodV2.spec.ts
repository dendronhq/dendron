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
import { getExtension } from "../../workspace";
import { describe } from "mocha";

suite(" Configure ExportPod V2 ", function () {
  const ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });
  describe("WHEN ConfigureExportV2 is run with New Export", () => {
    test("THEN new config must be created", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async () => {
          const cmd = new ConfigureExportPodV2();
          sinon
            .stub(PodUIControls, "promptForExportConfigOrNewExport")
            .returns(Promise.resolve("New Export"));
          const podType = PodV2Types.GoogleDocsExportV2;
          sinon
            .stub(PodUIControls, "promptForPodType")
            .returns(Promise.resolve(podType));
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

  describe("WHEN custom configs are present", () => {
    test("THEN config of selected podId must open", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async () => {
          const cmd = new ConfigureExportPodV2();
          sinon
            .stub(PodUIControls, "promptForExportConfigOrNewExport")
            .returns(Promise.resolve({ podId: "foobar" }));
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
