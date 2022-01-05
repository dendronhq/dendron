import { vault2Path } from "@dendronhq/common-server";
import { PodExportScope } from "@dendronhq/pods-core";
import { describe, after, beforeEach, afterEach } from "mocha";
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
import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import sinon from "sinon";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { PodUIControls } from "../../../../components/pods/PodControls";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ExtensionProvider } from "../../../../ExtensionProvider";

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

    describeMultiWS(
      "WHEN exporting a lookup based scope",
      {
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "test-note-for-pod1",
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "test-note-for-pod2",
          });
        },
      },
      () => {
        const cmd = new TestExportPodCommand();
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
          sandbox = sinon.createSandbox();
        });

        afterEach(() => {
          sandbox.restore();
        });

        test("THEN lookup is prompted and lookup result should be the export payload", async () => {
          const engine = ExtensionProvider.getEngine();
          const { wsRoot, vaults } = engine;
          const testNote1 = NoteUtils.getNoteByFnameV5({
            fname: "test-note-for-pod1",
            notes: engine.notes,
            wsRoot,
            vault: vaults[0],
          }) as NoteProps;
          const testNote2 = NoteUtils.getNoteByFnameV5({
            fname: "test-note-for-pod2",
            notes: engine.notes,
            wsRoot,
            vault: vaults[0],
          }) as NoteProps;
          const selectedItems = [
            { ...testNote1, label: "" },
            { ...testNote2, label: "" },
          ];
          const lookupStub = sandbox
            .stub(PodUIControls, "promptForScopeLookup")
            .resolves({
              selectedItems,
              onAcceptHookResp: [],
            });

          await cmd.enrichInputs({
            exportScope: PodExportScope.Lookup,
          });

          expect(lookupStub.calledOnce).toBeTruthy();

          await cmd.enrichInputs({
            exportScope: PodExportScope.LinksInSelection,
          });

          expect(lookupStub.calledTwice).toBeTruthy();
        });
      }
    );
  });
});
