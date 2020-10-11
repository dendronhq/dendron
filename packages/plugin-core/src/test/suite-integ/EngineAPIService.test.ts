import { DirResult, FileTestUtils } from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NoteTestPresetsV2,
} from "@dendronhq/common-test-utils";
import { afterEach, beforeEach } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("basic", function () {
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

  const NOTE_INIT_PRESET =
    NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.init;

  test(NOTE_INIT_PRESET.domainStub.label, function (done) {
    onWSInit(async () => {
      const client = DendronWorkspace.instance().getEngine();
      await client.init();
      const notes = client.notes;
      await NodeTestPresetsV2.runMochaHarness({
        opts: { notes },
        results: NOTE_INIT_PRESET.domainStub.results,
      });
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        await NOTE_INIT_PRESET.domainStub.before({ vaultDir });
      },
    });
  });
});
