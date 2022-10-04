import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  NOTE_BODY_PRESETS_V4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import {
  AirtablePublishPod,
  MarkdownPublishPod,
  podClassEntryToPodItemV4,
} from "@dendronhq/pods-core";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { PublishPodCommand } from "../../commands/PublishPod";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

suite("PublishV2", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ vault, wsRoot });
        const fpath = path.join(vpath, "foo.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(fpath));

        // when a user runs publish pod, they are presented with a list of pods
        // to execute
        // this mocks that command so that Markdown is the only option
        const cmd = new PublishPodCommand(ExtensionProvider.getExtension());
        const podChoice = podClassEntryToPodItemV4(MarkdownPublishPod);
        cmd.gatherInputs = async () => {
          return { podChoice };
        };

        // this runs the command
        const out = await cmd.run();
        expect(out?.endsWith("foo body")).toBeTruthy();
        done();
      },
    });
  });

  describeMultiWS(
    "WHEN publishing pod with required args",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      ctx,
    },
    () => {
      test("THEN show error when required arg not present", (done) => {
        // You can access the workspace inside the test like this:
        const cmd = new PublishPodCommand(ExtensionProvider.getExtension());
        const podChoice = podClassEntryToPodItemV4(AirtablePublishPod);
        cmd.gatherInputs = async () => {
          return { podChoice };
        };
        cmd.run().then(() => {
          expect(
            VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
              "config.publish.yml"
            )
          ).toBeTruthy();
          done();
        });
      });
    }
  );

  // TODO
  test.skip("note ref", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        await NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_TARGET.create({
          vault: vaults[0],
          wsRoot,
        });
        await NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_LINK.create({
          vault: vaults[0],
          wsRoot,
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ vault, wsRoot });
        const refTargetFname = NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_LINK.fname;
        const fpath = path.join(vpath, `${refTargetFname}.md`);
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(fpath));
        const cmd = new PublishPodCommand(ExtensionProvider.getExtension());
        const podChoice = podClassEntryToPodItemV4(MarkdownPublishPod);
        cmd.gatherInputs = async () => {
          return { podChoice };
        };
        const out = (await cmd.run()) as string;
        expect(
          await AssertUtils.assertInString({
            body: out,
            match: NOTE_BODY_PRESETS_V4.NOTE_REF_TARGET_BODY.split("\n"),
          })
        ).toBeTruthy();
        done();
      },
    });
  });
});
