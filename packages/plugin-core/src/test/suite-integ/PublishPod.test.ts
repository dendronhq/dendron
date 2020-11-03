import { DirResult, FileTestUtils } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import {
  MarkdownPublishPod,
  podClassEntryToPodItemV4,
} from "@dendronhq/pods-core";
import * as assert from "assert";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { PublishPodCommand } from "../../commands/PublishPod";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("PublishV2", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultDir: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", function (done) {
    onWSInit(async () => {
      const fpath = path.join(vaultDir, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(fpath));
      const cmd = new PublishPodCommand();
      const podChoice = podClassEntryToPodItemV4(MarkdownPublishPod);
      cmd.gatherInputs = async () => {
        return { podChoice };
      };
      const out = await cmd.run();
      assert.strictEqual(out, "foo body");
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
  });

  test("note ref", function (done) {
    onWSInit(async () => {
      const fpath = path.join(vaultDir, "bar.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(fpath));
      const cmd = new PublishPodCommand();
      const podChoice = podClassEntryToPodItemV4(MarkdownPublishPod);
      cmd.gatherInputs = async () => {
        return { podChoice };
      };
      const out = await cmd.run();
      assert.strictEqual(out, "foo body");
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createNoteRefPreset({
          vaultDir,
        });
      },
    });
  });
});
