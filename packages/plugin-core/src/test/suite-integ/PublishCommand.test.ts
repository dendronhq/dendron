import { DendronError } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import * as assert from "assert";
import { afterEach, beforeEach } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { PublishCommand } from "../../commands/Publish";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { runLegacyMultiWorkspaceTest } from "../testUtilsV3";

// suite("Publish", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//   });

//   afterEach(function () {
//     HistoryService.instance().clearSubscriptions();
//   });

//   // test.only("no repo", (done) => {
//   //   runLegacyMultiWorkspaceTest({
//   //     ctx,
//   //     preSetupHook: async ({ wsRoot, vaults }) => {
//   //       ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
//   //     },
//   //     onInit: async ({}) => {
//   //       try {
//   //         await new PublishCommand().execute({});
//   //       } catch (err) {
//   //         assert.strictEqual((err as DendronError).msg, "no repo found");
//   //         done();
//   //       }
//   //     },
//   //   });
//   // });

//   // test.skip("repo in docs", function (done) {
//   //   onWSInit(async () => {
//   //     const docsPath = path.join(root.name, "docs");
//   //     // TODO: setup remote git repo
//   //     await Git.createRepo(docsPath, { initCommit: true });
//   //     const config = DConfig.genDefaultConfig();
//   //     config.site.siteRepoDir = docsPath;
//   //     DConfig.writeConfig({ wsRoot: root.name, config });
//   //     await new PublishCommand().execute({});
//   //     done();
//   //   });

//   //   setupDendronWorkspace(root.name, ctx, {
//   //     useCb: async (vaultDir) => {
//   //       await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
//   //     },
//   //   });
//   // });
// });

suite("PublishV2", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("no repo", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({}) => {
        try {
          await new PublishCommand().execute({});
        } catch (err) {
          assert.strictEqual((err as DendronError).msg, "no repo found");
          done();
        }
      },
    });
  });
});
