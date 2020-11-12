import { DVault } from "@dendronhq/common-all";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { LookupControllerV2 } from "../../components/lookup/LookupControllerV2";
import { LookupProviderV2 } from "../../components/lookup/LookupProviderV2";
import { DendronQuickPickerV2 } from "../../components/lookup/types";
import { HistoryService } from "../../services/HistoryService";
import { EngineOpts } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import { onWSInit, TIMEOUT } from "../testUtils";
import { setupCodeWorkspaceMultiVaultV2 } from "../testUtilsv2";

suite("notes, multi", function () {
  let wsRoot: string;
  let vaults: DVault[];
  let ctx: vscode.ExtensionContext;
  const engOpts: EngineOpts = { flavor: "note" };
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  const setup = async (opts?: {
    beforeActivateCb: (opts: {
      vaults: DVault[];
      wsRoot: string;
    }) => Promise<void>;
  }) => {
    const {
      wsRoot: _wsRoot,
      vaults: _vaults,
    } = await setupCodeWorkspaceMultiVaultV2({ ctx });
    wsRoot = _wsRoot;
    vaults = _vaults;
    if (opts?.beforeActivateCb) {
      await opts.beforeActivateCb({ wsRoot, vaults });
    }
    await _activate(ctx);
  };

  const onInit = async (opts: {
    onInitCb: (opts: {
      lc: LookupControllerV2;
      lp: LookupProviderV2;
      quickpick: DendronQuickPickerV2;
    }) => Promise<void>;
  }) => {
    onWSInit(async () => {
      const { onInitCb } = opts;
      const engOpts: EngineOpts = { flavor: "note" };
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      const quickpick = await lc.show();
      await onInitCb({ lp, quickpick, lc });
    });
  };

  describe("updateItems", function () {
    test("empty qs", function (done) {
      onInit({
        onInitCb: async ({ quickpick, lp, lc }) => {
          quickpick.value = "";
          await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
          assert.strictEqual(lc.quickPick?.items.length, 4);
          done();
        },
      });
      setup();
    });

    // TODO: this causes next test to fail
    test.skip("opened note", function (done) {
      onWSInit(async () => {
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(path.join(vaults[0].fsPath, "foo.md"))
        );
        const quickpick = await lc.show();
        quickpick.value = "";
        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
        quickpick.onDidChangeActive(() => {
          assert.strictEqual(lc.quickPick?.activeItems.length, 1);
          assert.strictEqual(lc.quickPick?.activeItems[0].fname, "foo");
          done();
        });
        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
      });
      setup();
    });

    test("schema suggestion", function (done) {
      onInit({
        onInitCb: async ({ quickpick, lp }) => {
          quickpick.value = "foo.";
          await lp.onUpdatePickerItem(quickpick, { flavor: "note" }, "manual");
          assert.deepStrictEqual(quickpick.items.length, 4);
          assert.deepStrictEqual(
            _.pick(_.find(quickpick.items, { fname: "foo.ch1" }), [
              "fname",
              "schemaStub",
            ]),
            {
              fname: "foo.ch1",
              schemaStub: true,
            }
          );
          done();
        },
      });

      setup({
        beforeActivateCb: async ({ vaults }) => {
          fs.removeSync(path.join(vaults[0].fsPath, "foo.ch1.md"));
        },
      });
    });
  });
});
