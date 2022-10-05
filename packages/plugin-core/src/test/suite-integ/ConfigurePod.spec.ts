import { DirResult, tmpDir, writeYAML } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import {
  JSONExportPod,
  podClassEntryToPodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
import { ConfigurePodCommand } from "../../commands/ConfigurePodCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("ConfigurePod", function () {
  let root: DirResult;
  let podsDir: string;

  const ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
      podsDir = path.join(root.name, "pods");
    },
  });

  test("no config", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async () => {
        const cmd = new ConfigurePodCommand(ExtensionProvider.getExtension());
        const podChoice = podClassEntryToPodItemV4(JSONExportPod);
        cmd.gatherInputs = async () => {
          return { podClass: podChoice.podClass };
        };
        await cmd.run();
        const activePath =
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
        expect(
          activePath?.endsWith("pods/dendron.json/config.export.yml")
        ).toBeTruthy();
        done();
      },
    });
  });

  test("config present", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async () => {
        const cmd = new ConfigurePodCommand(ExtensionProvider.getExtension());
        const podChoice = podClassEntryToPodItemV4(JSONExportPod);
        const podClass = podChoice.podClass;
        cmd.gatherInputs = async () => {
          return { podClass };
        };

        // setup
        const configPath = PodUtils.getConfigPath({ podsDir, podClass });
        const exportDest = path.join(
          PodUtils.getPath({ podsDir, podClass }),
          "export.json"
        );
        ensureDirSync(path.dirname(configPath));

        writeYAML(configPath, { dest: exportDest });
        await cmd.run();
        const activePath =
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
        expect(
          activePath?.endsWith("pods/dendron.json/config.export.yml")
        ).toBeTruthy();
        done();
      },
    });
  });
});
