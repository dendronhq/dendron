import { DirResult, tmpDir, writeYAML } from "@dendronhq/common-server";
import { NodeTestPresetsV2, PODS_CORE } from "@dendronhq/common-test-utils";
import {
  JSONImportPod,
  JSONImportPodRawConfig,
  podClassEntryToPodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { ImportPodCommand } from "../../commands/ImportPod";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("ImportPod", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultDir: string;
  let podsDir: string;
  let importSrc: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
    podsDir = path.join(root.name, "pods");
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", function (done) {
    onWSInit(async () => {
      const podClass = JSONImportPod;
      const configPath = PodUtils.getConfigPath({ podsDir, podClass });
      const config: JSONImportPodRawConfig = {
        src: importSrc,
        concatenate: false,
      };
      ensureDirSync(path.dirname(configPath));
      writeYAML(configPath, config);

      // stub cmd
      const cmd = new ImportPodCommand();
      const podChoice = podClassEntryToPodItemV4(JSONImportPod);
      cmd.gatherInputs = async () => {
        return { podChoice };
      };
      await cmd.run();
      await NodeTestPresetsV2.runMochaHarness({
        opts: {
          vaultPath: vaultDir,
          vscode: true,
        },
        results: PODS_CORE.JSON.IMPORT.BASIC.results,
      });
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        ({ importSrc } = await PODS_CORE.JSON.IMPORT.BASIC.before({
          wsRoot: root.name,
        }));
      },
    });
  });
});
