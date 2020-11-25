// import { DirResult, tmpDir } from "@dendronhq/common-server";
// import { NodeTestPresetsV2, PODS_CORE } from "@dendronhq/common-test-utils";
// import {
//   JSONExportPod,
//   podClassEntryToPodItemV4,
//   PodUtils,
// } from "@dendronhq/pods-core";
// import assert from "assert";
// import { afterEach, beforeEach } from "mocha";
// import path from "path";
// // // You can import and use all API from the 'vscode' module
// // // as well as import your extension to test it
// import * as vscode from "vscode";
// import { ExportPodCommand } from "../../commands/ExportPod";
// import { HistoryService } from "../../services/HistoryService";
// import { VSCodeUtils } from "../../utils";
// import { DendronWorkspace } from "../../workspace";
// import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

// suite("ExportPod", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   let vaultDir: string;
//   let podsDir: string;
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//     podsDir = path.join(root.name, "pods");
//   });

//   afterEach(function () {
//     HistoryService.instance().clearSubscriptions();
//   });

//   test("no config", function (done) {
//     onWSInit(async () => {
//       const cmd = new ExportPodCommand();
//       const podChoice = podClassEntryToPodItemV4(JSONExportPod);
//       cmd.gatherInputs = async () => {
//         return { podChoice };
//       };
//       await cmd.run();
//       const configPath = PodUtils.getConfigPath({
//         podsDir,
//         podClass: JSONExportPod,
//       });
//       assert.deepEqual(
//         VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
//         configPath
//       );
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       useCb: async (_vaultDir) => {
//         vaultDir = _vaultDir;
//         await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
//           vaultDir,
//         });
//       },
//     });
//   });

//   test("basic", function (done) {
//     onWSInit(async () => {
//       const podClass = JSONExportPod;
//       const configPath = PodUtils.getConfigPath({ podsDir, podClass });
//       const exportDest = path.join(
//         PodUtils.getPath({ podsDir, podClass }),
//         "export.json"
//       );
//       await PODS_CORE.JSON.EXPORT.BASIC.before({ configPath, exportDest });
//       // stub cmd
//       const cmd = new ExportPodCommand();
//       const podChoice = podClassEntryToPodItemV4(JSONExportPod);
//       cmd.gatherInputs = async () => {
//         return { podChoice };
//       };
//       await cmd.run();
//       await NodeTestPresetsV2.runMochaHarness({
//         opts: {
//           destPath: exportDest,
//           vault: { fsPath: vaultDir },
//         },
//         results: PODS_CORE.JSON.EXPORT.BASIC.results,
//       });
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       useCb: async (_vaultDir) => {
//         vaultDir = _vaultDir;
//         await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
//           vaultDir,
//         });
//       },
//     });
//   });
// });
