import { env } from "@dendronhq/common-all";
import { AssertUtils, ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { DiagnosticsReportCommand } from "../../commands/DiagnosticsReport";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("DiagnosticsReport", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);

  test.skip("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({}) => {
        const log_dst = path.join(
          path.dirname(env("LOG_DST")),
          "dendron.server.log"
        );
        fs.writeFileSync(log_dst, "foobar", { encoding: "utf8" });
        const cmd = new DiagnosticsReportCommand();
        await cmd.execute();

        const body = (await VSCodeUtils.getActiveTextEditor()?.document.getText()) as string;
        expect(
          await AssertUtils.assertInString({
            body,
            match: ["foobar", "Dendron Confg", "Plugin Logs"],
          })
        ).toBeTruthy();
        done();
      },
    });
  });
});
