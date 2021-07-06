import { DPod } from "@dendronhq/common-all";
import { writeYAML } from "@dendronhq/common-server";
import { PODS_CORE } from "@dendronhq/engine-test-utils";
import {
  JSONImportPod,
  podClassEntryToPodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { ImportPodCommand } from "../../commands/ImportPod";
import { getWS } from "../../workspace";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("ImportPod", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("json", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await PODS_CORE.JSON.IMPORT.BASIC.preSetupHook({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const podClass = JSONImportPod;
        const podsDir = path.join(wsRoot, "pods");
        const configPath = PodUtils.getConfigPath({ podsDir, podClass });

        const fakePod = (): DPod<any> => {
          return {
            config: [],
            execute: async ({ config }) => {
              ensureDirSync(path.dirname(configPath));
              writeYAML(configPath, config);

              const cmd = new ImportPodCommand();
              const podChoice = podClassEntryToPodItemV4(JSONImportPod);
              // @ts-ignore
              cmd.gatherInputs = async () => {
                return { label: "", podChoice };
              };
              await cmd.run();
            },
          };
        };
        const pod = fakePod();
        const engine = getWS().getEngine();
        await PODS_CORE.JSON.IMPORT.BASIC.testFunc({
          engine,
          wsRoot,
          vaults,
          extra: { pod },
          initResp: {} as any,
        });
        done();
      },
    });
  });
});
