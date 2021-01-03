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
import _ from "lodash";
import path from "path";
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

  // mocks workspac context needed for extension to start
  ctx = setupBeforeAfter(this);

  /**
   * When renaing a note, Dendron should throw an error if the note already exists.
   * We pass in `done` to the test because it is asynchronous.
   */
  test("note exists", (done) => {
    // start a workspace with a single vault
    runLegacySingleWorkspaceTest({
      // this is needed to setup the mock workspace
      ctx,
      // code that runs after the workspace and vault folders have been created
      postSetupHook: async ({ wsRoot, vaults }) => {
        // ENGINE_HOOKS creates a bunch of preset note fixtures
        // `setupBasic` creates a basic workspace with  `foo.md`, `foo.ch1.md, and `bar.md`
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      // this runs when the workspace is activated
      // the test code goes here
      onInit: async ({ vaults, wsRoot }) => {
        // right now, vaultPaths can be absolute or relative depending on what version of Dendron
        // is running. this method normalizes the path relative to the workspace root
        const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
        try {
          // this will open `foo.ch1` in the editor
          await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(path.join(vaultDir, "foo.ch1.md"))
          );
          // we expect the command to throw an error when checking the inputs
          // see command lifecycle here: https://dendron.so/notes/d410c0d6-9ede-42ef-9c96-662902e4f488.html#running-a-command
          await new RenameNoteV2aCommand().enrichInputs({ dest: "foo" });
        } catch (err) {
          expect((err as DendronError).status).toEqual(
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
          expect(resp?.changed?.length).toEqual(2);
          active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
          expect(DNodeUtilsV2.fname(active.document.uri.fsPath)).toEqual(
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
