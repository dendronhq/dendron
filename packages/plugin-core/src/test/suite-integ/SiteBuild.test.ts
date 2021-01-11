import { DuplicateNoteAction } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import { ConfigUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import * as vscode from "vscode";
import { SiteBuildCommand } from "../../commands/SiteBuild";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

// TODO: run manually, this takes a while...
suite("SiteBuild", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
    afterHook: () => {},
  });

  test.skip("basic", function (done) {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const cmd = new SiteBuildCommand();
        await cmd.execute();
        await ConfigUtils.withConfig(
          (config) => {
            config.site.duplicateNoteBehavior = {
              action: DuplicateNoteAction.USE_VAULT,
              payload: { vault },
            };
            return config;
          },
          { wsRoot }
        );
        const wsRootDir = fs.readdirSync(wsRoot);
        expect(wsRootDir).toEqual([]);
        done();
        // const vault = vaults[0];
        // const cmd = new PublishPodCommand();
        // const podChoice = podClassEntryToPodItemV4(MarkdownPublishPod);
        // cmd.gatherInputs = async () => {
        //   return { podChoice };
        // };
        // const out = await cmd.run();
        // assert.strictEqual(out, "foo body");
        // done();
      },
    });
  });
});
