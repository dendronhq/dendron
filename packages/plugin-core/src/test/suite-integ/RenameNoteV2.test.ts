import {
  DendronError,
  DNodeUtilsV2,
  DVault,
  ENGINE_ERROR_CODES,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  ENGINE_HOOKS,
  ENGINE_RENAME_PRESETS,
  runJestHarnessV2,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import assert from "assert";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { RenameNoteV2aCommand } from "../../commands/RenameNoteV2a";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { expect } from "../testUtilsv2";
import {
  createEngineFactory,
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
} from "../testUtilsV3";

const createEngine = createEngineFactory({
  renameNote: (opts: WorkspaceOpts) => {
    const rename: DendronEngineV2["renameNote"] = async ({
      oldLoc,
      newLoc,
    }) => {
      const cmd = new RenameNoteV2aCommand();
      const vpathOld = vault2Path({
        vault: oldLoc.vault as DVault,
        wsRoot: opts.wsRoot,
      });
      await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(path.join(vpathOld, oldLoc.fname + ".md"))
      );
      VSCodeUtils.showInputBox = async () => newLoc.fname;
      const resp = await cmd.run();
      return {
        error: null,
        data: resp?.changed,
      };
    };
    return rename;
  },
});

suite("RenameNote", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("note exists", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
        try {
          await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(path.join(vaultDir, "foo.ch1.md"))
          );
          await new RenameNoteV2aCommand().enrichInputs({ dest: "foo" });
        } catch (err) {
          assert.strictEqual(
            (err as DendronError).status,
            ENGINE_ERROR_CODES.NODE_EXISTS
          );
          done();
        }
      },
    });
  });

  test("update body", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vaultDir = vault2Path({ vault: vaults[0], wsRoot });

        {
          await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(path.join(vaultDir, "foo.md"))
          );
          let active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("type", { text: "hello" });
          await active.document.save();

          VSCodeUtils.showInputBox = async () => "foobar";
          const resp = await new RenameNoteV2aCommand().run();
          assert.deepStrictEqual(resp?.changed?.length, 2);
          active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
          assert.strictEqual(
            DNodeUtilsV2.fname(active.document.uri.fsPath),
            "foobar"
          );
          assert.ok(active.document.getText().indexOf("hello") >= 0);
          done();
        }
      },
    });
  });

  // _.map(
  //   _.pick(ENGINE_RENAME_PRESETS["NOTES"], "TARGET_IN_VAULT1_AND_LINK_IN_VAULT2"),
  //   (TestCase: TestPresetEntryV4, name: string) => {
  _.map(ENGINE_RENAME_PRESETS["NOTES"], (TestCase: TestPresetEntryV4, name) => {
    test(name, (done) => {
      const { testFunc, preSetupHook } = TestCase;

      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await preSetupHook({
            wsRoot,
            vaults,
          });
        },
        onInit: async ({ vaults, wsRoot }) => {
          const engineMock = createEngine({ wsRoot, vaults });
          const results = await testFunc({
            engine: engineMock,
            vaults,
            wsRoot,
            initResp: {} as any,
          });
          await runJestHarnessV2(results, expect);
          done();
        },
      });
    });
  });
});
