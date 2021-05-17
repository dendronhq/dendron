import { SyncCommand } from "../../commands/Sync";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import * as vscode from "vscode";
import _ from "lodash";
import { GitTestUtils } from "@dendronhq/engine-test-utils";

suite("workspace sync command", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {});

  test("basic", async () =>
    runLegacyMultiWorkspaceTest({
      onInit: async ({ wsRoot }) => {
        await GitTestUtils.createRepoForWorkspace(wsRoot);

        const out = await new SyncCommand().run();
        expect(out).toBeTruthy();
        const { committed, pulled, pushed } = out as any;
        // The files that default wsRoot created should get committed
        expect(committed.length).toEqual(1);
        // Nothing to pull or push since we don't have a remote set up
        expect(pulled.length).toEqual(0);
        expect(pushed.length).toEqual(0);
      },
      ctx,
    }));
});
