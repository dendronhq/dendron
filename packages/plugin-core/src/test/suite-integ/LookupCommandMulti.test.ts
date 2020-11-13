import { DNodeUtilsV2, DVault } from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import { NodeTestPresetsV2, PLUGIN_CORE } from "@dendronhq/common-test-utils";
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
import { createNoActiveItem } from "../../components/lookup/utils";
import { HistoryService } from "../../services/HistoryService";
import { EngineOpts } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import { createMockQuickPick, onWSInit, TIMEOUT } from "../testUtils";
import {
  getNoteFromTextEditor,
  setupCodeWorkspaceMultiVaultV2,
} from "../testUtilsv2";

const { LOOKUP_SINGLE_TEST_PRESET } = PLUGIN_CORE;

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

  const runUpdateItemTest = async (opts: {
    beforeActivateCb?: (opts: {
      vaults: DVault[];
      wsRoot: string;
    }) => Promise<void>;
    onInitCb: (opts: {
      lc: LookupControllerV2;
      lp: LookupProviderV2;
      quickpick: DendronQuickPickerV2;
    }) => Promise<void>;
  }) => {
    const { onInitCb } = opts;
    onInitForUpdateItems({ onInitCb });
    const {
      wsRoot: _wsRoot,
      vaults: _vaults,
    } = await setupCodeWorkspaceMultiVaultV2({ ctx });
    wsRoot = _wsRoot;
    vaults = _vaults;
    if (opts.beforeActivateCb) {
      await opts.beforeActivateCb({ wsRoot, vaults });
    }
    await _activate(ctx);
  };

  const runAcceptItemTest = async (opts: {
    beforeActivateCb?: (opts: {
      vaults: DVault[];
      wsRoot: string;
    }) => Promise<void>;
    onInitCb: (opts: {
      lc: LookupControllerV2;
      lp: LookupProviderV2;
    }) => Promise<void>;
  }) => {
    console.log("runAcceptItemTest:enter");
    const { onInitCb } = opts;
    onInitForAcceptItems({ onInitCb });
    const {
      wsRoot: _wsRoot,
      vaults: _vaults,
      workspaceFolders,
    } = await setupCodeWorkspaceMultiVaultV2({ ctx });
    console.log(
      "runAcceptItemTest:setupCodeWorkspaceV2",
      JSON.stringify({ vaults, workspaceFolders })
    );
    wsRoot = _wsRoot;
    vaults = _vaults;
    if (opts.beforeActivateCb) {
      await opts.beforeActivateCb({ wsRoot, vaults });
    }
    console.log("runAcceptItemTest:pre_activate");
    await _activate(ctx);
    console.log("runAcceptItemTest:post_activate");
  };

  const onInitForUpdateItems = async (opts: {
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

  const onInitForAcceptItems = async (opts: {
    onInitCb: (opts: {
      lc: LookupControllerV2;
      lp: LookupProviderV2;
    }) => Promise<void>;
  }) => {
    onWSInit(async () => {
      const { onInitCb } = opts;
      const engOpts: EngineOpts = { flavor: "note" };
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      await onInitCb({ lp, lc });
    });
  };

  describe("updateItems", function () {
    test("empty qs", function (done) {
      runUpdateItemTest({
        onInitCb: async ({ quickpick, lp, lc }) => {
          quickpick.value = "";
          await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
          assert.strictEqual(lc.quickPick?.items.length, 4);
          done();
        },
      });
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
    });

    test("schema suggestion", function (done) {
      runUpdateItemTest({
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
        beforeActivateCb: async ({ vaults }) => {
          fs.removeSync(path.join(vaults[0].fsPath, "foo.ch1.md"));
        },
      });
    });
  });

  describe("accept items", function () {
    test("exiting item", function (done) {
      runAcceptItemTest({
        onInitCb: async ({ lp }) => {
          const ws = DendronWorkspace.instance();
          const client = ws.getEngine();
          const note = client.notes["foo"];
          const item = DNodeUtilsV2.enhancePropForQuickInput({
            props: note,
            schemas: client.schemas,
            vaults: DendronWorkspace.instance().config.vaults,
          });
          const quickpick = createMockQuickPick({
            value: "foo",
            selectedItems: [item],
          });
          await lp.onDidAccept(quickpick, engOpts);
          await NodeTestPresetsV2.runMochaHarness({
            opts: {
              activeFileName: DNodeUtilsV2.fname(
                VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
              ),
              activeNote: getNoteFromTextEditor(),
            },
            results:
              LOOKUP_SINGLE_TEST_PRESET.ACCEPT_ITEMS.EXISTING_ITEM.results,
          });
          done();
        },
      });
    });

    test("new item", function (done) {
      runAcceptItemTest({
        onInitCb: async ({ lp }) => {
          console.log("onInitCb:enter");
          const ws = DendronWorkspace.instance();
          const client = ws.getEngine();
          const note = client.notes["foo"];
          await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(path.join(note.vault.fsPath, note.fname + ".md"))
          );
          const quickpick = createMockQuickPick({
            value: "bond",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          await lp.onDidAccept(quickpick, engOpts);
          assert.strictEqual(
            DNodeUtilsV2.fname(
              VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
            ),
            "bond"
          );
          const txtPath = vscode.window.activeTextEditor?.document.uri
            .fsPath as string;
          const vault = { fsPath: path.dirname(txtPath) };
          const node = file2Note(txtPath, vault);
          assert.strictEqual(node.title, "Bond");
          console.log("onInitCb:exit");
          done();
        },
      });
    });
  });
});
