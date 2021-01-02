import { DVault, NoteUtilsV2 } from "@dendronhq/common-all";
import { DirResult, note2File, tmpDir } from "@dendronhq/common-server";
import {
  AssertUtils,
  ENGINE_HOOKS_MULTI,
  NodeTestPresetsV2,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VaultWatcher } from "../../fileWatcher";
import { VSCodeUtils } from "../../utils";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  let vault: DVault;
  let watcher: VaultWatcher;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
  });

  describe("onDidCreate", function () {
    test("onDidCreate", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ vaults, wsRoot }) => {
          const bar = NoteUtilsV2.create({
            fname: `bar`,
            id: `bar`,
            body: "bar body",
            updated: "1",
            created: "1",
            vault: vaults[0],
          });
          await note2File({
            note: bar,
            vault: vaults[0],
            wsRoot,
          });
          watcher = new VaultWatcher({
            wsRoot,
            vaults,
          });

          const notePath = path.join(wsRoot, vaults[0].fsPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          const note = await watcher.onDidCreate(uri);
          expect(note!.id).toEqual(bar.id);
          done();
        },
      });
    });

    test("onDidChange", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ vaults, wsRoot, engine }) => {
          const foo = engine.notes["foo"];
          const editor = await VSCodeUtils.openNote(foo);
          await editor?.edit((builder) => {
            const pos = new vscode.Position(10, 0);
            const selection = new vscode.Selection(pos, pos);
            builder.replace(selection, `Hello`);
          });
          watcher = new VaultWatcher({
            wsRoot,
            vaults,
          });
          const uri = editor.document.uri;
          await watcher.onDidChange(uri);
          expect(
            await AssertUtils.assertInString({
              body: engine.notes["foo"].body,
              match: ["Hello"],
            })
          ).toBeTruthy();
          done();
        },
      });
    });

    test.skip("pause ", function (done) {
      onWSInit(async () => {
        // @ts-ignore
        const watcher = new VaultWatcher({
          vaults: [{ fsPath: vaultPath }],
        });
        watcher.pause = true;
        const bar = NoteUtilsV2.create({
          fname: `bar`,
          id: `bar`,
          body: "bar body",
          updated: "1",
          created: "1",
          vault,
        });
        await note2File({
          note: bar,
          vault: { fsPath: vaultPath },
          wsRoot: "FAKE_ROOT",
        });
        const notePath = path.join(vaultPath, "bar.md");
        const uri = vscode.Uri.file(notePath);
        const note = await watcher.onDidCreate(uri);
        assert.ok(_.isUndefined(note));
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir) => {
          vaultPath = vaultDir;
          vault = { fsPath: vaultPath };
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        },
      });
    });
  });
});
