import { DirResult, FileTestUtils } from "@dendronhq/common-server";
import { NodeTestPresetsV2, PODS_CORE } from "@dendronhq/common-test-utils";
import { SnapshotExportPodResp } from "@dendronhq/pods-core";
import { afterEach, beforeEach } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { SnapshotVaultCommand } from "../../commands/SnapshotVault";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

const { DEFAULTS } = PODS_CORE.SNAPSHOT.EXPORT;
suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  // need to add git folder
  test.skip("basic", (done) => {
    onWSInit(async () => {
      const wsRoot = DendronWorkspace.rootDir();
      const {
        snapshotDirPath,
      } = (await new SnapshotVaultCommand().run()) as SnapshotExportPodResp;
      await NodeTestPresetsV2.runMochaHarness({
        opts: {
          wsRoot,
          snapshotDirPath,
        },
        results: DEFAULTS.results,
      });
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      withAssets: true,
      useCb: async (vaultDir) => {
        await DEFAULTS.before({ vaultDir });
      },
    });
  });
});
