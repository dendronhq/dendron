import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { ConfigureCommand } from "../../commands/ConfigureCommand";
import { CONFIG } from "../../constants";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacySingleWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("ConfigureCommand", () => {
  describe("basic", function () {
    let ctx: vscode.ExtensionContext;
    ctx = setupBeforeAfter(this);

    test("ok", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot }) => {
          await new ConfigureCommand().run();
          expect(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()
          ).toEqual(path.join(wsRoot, "dendron.yml").toLowerCase());
          done();
        },
      });
    });

    test.skip("diff dendronRoot", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        configOverride: {
          [CONFIG.DENDRON_DIR.key]: "dendron",
        },
        onInit: async ({ wsRoot }) => {
          await new ConfigureCommand().run();
          expect(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath
          ).toEqual(path.join(wsRoot, "dendron", "dendron.yml"));
          done();
        },
      });
    });
  });
});
