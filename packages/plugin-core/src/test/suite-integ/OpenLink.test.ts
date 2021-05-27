import { vault2Path } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { OpenLinkCommand } from "../../commands/OpenLink";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("OpenLink", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);

  test("error: nothing selected", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({}) => {
        const cmd = new OpenLinkCommand();
        const { error } = await cmd.execute();
        expect(error!.message).toEqual("nothing selected");
        done();
      },
    });
  });

  // TODO
  test.skip("open in diff vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[1];
        const assetPath = path.join("assets", "foo.txt");
        const vpath = vault2Path({ vault, wsRoot });
        fs.ensureFileSync(path.join(vpath, assetPath));
        // TODO: write into the current note
        done();
      },
    });
  });
});
