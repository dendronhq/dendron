import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe, test } from "mocha";
import sinon from "sinon";
import { ExtensionContext, Position, Selection } from "vscode";
import { VSCodeUtils } from "../../utils";
import { WorkspaceWatcher } from "../../WorkspaceWatcher";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("WorkspaceWatcher", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: async () => {},
    afterHook: async () => {
      sinon.restore();
    },
  });

  describe("onWillSave", function () {
    test("don't save when content the same", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ engine }) => {
          const note = engine.notes["foo"];
          const { document } = await VSCodeUtils.openNote(note);
          const watcher = new WorkspaceWatcher();
          const out = await watcher.onWillSaveTextDocument({
            document,
            reason: {} as any,
            waitUntil: async (p: Promise<any>) => {
              return p;
            },
          });
          expect(out.changes.length).toEqual(0);
          done();
        },
      });
    });

    test("ok: save when content changed", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ engine }) => {
          const note = engine.notes["foo"];
          const { document, edit } = await VSCodeUtils.openNote(note);
          const pos = new Position(8, 0);
          await edit((builder) => {
            const selection = new Selection(pos, pos);
            builder.replace(selection, "foo bar");
          });
          const watcher = new WorkspaceWatcher();
          const out = await watcher.onWillSaveTextDocument({
            document,
            reason: {} as any,
            waitUntil: async (p: Promise<any>) => {
              return p;
            },
          });
          expect(out.changes.length).toEqual(1);
          done();
        },
      });
    });
  });
});
