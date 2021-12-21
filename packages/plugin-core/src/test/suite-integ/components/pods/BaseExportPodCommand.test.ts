import { vault2Path } from "@dendronhq/common-server";
import { PodExportScope } from "@dendronhq/pods-core";
import { describe, after } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { getDWorkspace } from "../../../../workspace";
import { expect } from "../../../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  setupBeforeAfter,
} from "../../../testUtilsV3";
import { VSCodeUtils } from "../../../../vsCodeUtils";
import { TestExportPodCommand } from "./TestExportCommand";
import { NoteProps } from "@dendronhq/common-all";
import sinon from "sinon";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";

suite("BaseExportPodCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("GIVEN a BaseExportPodCommand implementation", () => {
    describeSingleWS(
      "WHEN exporting a clipboard scope",
      {
        ctx,
      },
      () => {
        const cmd = new TestExportPodCommand();

        test("THEN clipboard contents should be in the export payload", async () => {
          vscode.env.clipboard.writeText("test");
          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Clipboard,
          });

          expect(payload?.payload).toEqual("test");
        });
      }
    );

    describeSingleWS(
      "WHEN exporting a selection scope",
      {
        ctx,
      },
      () => {
        const cmd = new TestExportPodCommand();

        test("THEN selection contents should be undefined if nothing is highlighted", async () => {
          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Selection,
          });

          expect(payload?.payload).toBeFalsy();
        });

        // TODO: Add positive test case with text selection
      }
    );

    describeSingleWS(
      "WHEN exporting a note scope",
      {
        ctx,
      },
      () => {
        const cmd = new TestExportPodCommand();

        test("THEN selection contents should be in the export payload", async () => {
          const { wsRoot, vaults } = getDWorkspace();

          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "root.md"
          );
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));

          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Note,
          });
          expect(typeof payload?.payload === "string").toBeFalsy();
          expect((payload?.payload as NoteProps[])[0].fname).toEqual("root");
          expect((payload?.payload as NoteProps[]).length).toEqual(1);
        });
      }
    );

    describeMultiWS(
      "WHEN exporting a hierarchy scope",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        const cmd = new TestExportPodCommand();

        test("THEN hierarchy note props should be in the export payload", async () => {
          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Hierarchy,
          });

          // 'foo' note and its child:
          expect(payload?.payload.length).toEqual(2);
        });

        after(() => {
          sinon.restore();
        });
      }
    );

    describeMultiWS(
      "WHEN exporting a workspace scope",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        const cmd = new TestExportPodCommand();

        test("THEN workspace note props should be in the export payload", async () => {
          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Workspace,
          });

          expect(payload?.payload.length).toEqual(6);
        });
      }
    );
  });
});
