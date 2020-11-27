import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  ENGINE_HOOKS,
  NOTE_BODY_PRESETS_V4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import {
  MarkdownPublishPod,
  podClassEntryToPodItemV4,
} from "@dendronhq/pods-core";
import * as assert from "assert";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { PublishPodCommand } from "../../commands/PublishPod";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest } from "../testUtilsV3";

suite("PublishV2", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ vault, wsRoot });
        const fpath = path.join(vpath, "foo.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(fpath));
        const cmd = new PublishPodCommand();
        const podChoice = podClassEntryToPodItemV4(MarkdownPublishPod);
        cmd.gatherInputs = async () => {
          return { podChoice };
        };
        const out = await cmd.run();
        assert.strictEqual(out, "foo body");
        done();
      },
    });
  });

  test("note ref", (done) => {
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
        const cmd = new PublishPodCommand();
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
