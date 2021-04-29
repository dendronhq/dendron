import { DNodeUtils, DVault, WorkspaceOpts } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  ENGINE_HOOKS,
  ENGINE_RENAME_PRESETS,
  runJestHarnessV2,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { RenameNoteV2aCommand } from "../../commands/RenameNoteV2a";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import {
  createEngineFactory,
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

const createEngine = createEngineFactory({
  renameNote: (opts: WorkspaceOpts) => {
    const rename: DendronEngineV2["renameNote"] = async ({
      oldLoc,
      newLoc,
    }) => {
      const cmd = new RenameNoteV2aCommand();
      sinon.stub(cmd, "gatherInputs").returns(
        Promise.resolve({
          move: [
            {
              oldLoc: {
                fname: oldLoc.fname,
              },
              newLoc: {
                fname: newLoc.fname,
              },
            },
          ],
        })
      );

      const vpathOld = vault2Path({
        vault: oldLoc.vault as DVault,
        wsRoot: opts.wsRoot,
      });
      await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(path.join(vpathOld, oldLoc.fname + ".md"))
      );
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

  // mocks workspac context needed for extension to start
  ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });

  /**
   * When renaing a note, Dendron should throw an error if the note already exists.
   * We pass in `done` to the test because it is asynchronous.
   */
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

          const cmd = new RenameNoteV2aCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              move: [
                {
                  oldLoc: {
                    fname: "foo",
                  },
                  newLoc: {
                    fname: "foobar",
                  },
                },
              ],
            })
          );
          const resp = await cmd.run();
          expect(resp?.changed?.length).toEqual(2);
          active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
          expect(DNodeUtils.fname(active.document.uri.fsPath)).toEqual(
            "foobar"
          );
          expect(active.document.getText().indexOf("hello") >= 0).toBeTruthy();
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
