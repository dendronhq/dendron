import { writeYAML } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { PodUtils, PodV2Types } from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
import sinon from "sinon";
import { ConfigureExportPodV2 } from "../../commands/pods/ConfigureExportPodV2";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";
import { PodUIControls } from "../../components/pods/PodControls";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describe } from "mocha";

suite("Configure ExportPod V2 ", function () {
  const ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });
  describe("GIVEN Configure Export V2 is run", () => {
    describeMultiWS(
      "WHEN New Export option is selected from the Quickpick",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN new config must be created", async () => {
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
        });
      }
    );

    describeMultiWS(
      "AND WHEN a custom pod ID is selected",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN config of selected podId must open", async () => {
          const cmd = new ConfigureExportPodV2();
          sinon
            .stub(PodUIControls, "promptForExportConfigOrNewExport")
            .returns(Promise.resolve({ podId: "foobar" }));
          //setup
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const configPath = PodUtils.getCustomConfigPath({
            wsRoot,
            podId: "foobar",
          });
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
        });
      }
    );
  });
});
