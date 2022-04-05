import { vault2Path } from "@dendronhq/common-server";
import { PodExportScope } from "@dendronhq/pods-core";
import { describe, after, beforeEach, afterEach } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { expect } from "../../../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  waitInMilliseconds,
} from "../../../testUtilsV3";
import { VSCodeUtils } from "../../../../vsCodeUtils";
import { TestExportPodCommand } from "./TestExportCommand";
import { assert, DVault, NoteProps, NoteUtils } from "@dendronhq/common-all";
import sinon from "sinon";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import { PodUIControls } from "../../../../components/pods/PodControls";
import {
  NoteTestUtilsV4,
  testAssertsInsideCallback,
} from "@dendronhq/common-test-utils";
import { ExtensionProvider } from "../../../../ExtensionProvider";

const stubQuickPick = (vault: DVault) => {
  // @ts-ignore
  VSCodeUtils.showQuickPick = () => {
    return { data: vault };
  };
};

suite("BaseExportPodCommand", function () {
  describe("GIVEN a BaseExportPodCommand implementation", () => {
    describeSingleWS(
      "WHEN exporting a note scope",
      {
        postSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN note prop should be in the export payload", async () => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();

          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "root.md"
          );
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));

          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Note,
          });
          expect((payload?.payload as NoteProps[])[0].fname).toEqual("root");
          expect((payload?.payload as NoteProps[]).length).toEqual(1);
        });

        test("AND note is dirty, THEN a onDidSaveTextDocument should be fired", (done) => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );
          const engine = ExtensionProvider.getEngine();

          const testNote = engine.notes["foo"];
          const textToAppend = "BaseExportPodCommand testing";
          // onEngineNoteStateChanged is not being triggered by save so test to make sure that save is being triggered instead
          const disposable = vscode.workspace.onDidSaveTextDocument(
            (textDocument) => {
              testAssertsInsideCallback(() => {
                expect(
                  textDocument.getText().includes(textToAppend)
                ).toBeTruthy();
                expect(textDocument.fileName.endsWith("foo.md")).toBeTruthy();
                disposable.dispose();
                cmd.dispose();
              }, done);
            }
          );

          ExtensionProvider.getWSUtils()
            .openNote(testNote)
            .then(async (editor) => {
              editor
                .edit(async (editBuilder) => {
                  const line = editor.document.getText().split("\n").length;
                  editBuilder.insert(
                    new vscode.Position(line, 0),
                    textToAppend
                  );
                })
                .then(async () => {
                  cmd.run();
                });
            });
        });

        test("AND note is clean, THEN a onDidSaveTextDocument should not be fired", (done) => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );
          const engine = ExtensionProvider.getEngine();

          const testNote = engine.notes["foo"];
          vscode.workspace.onDidSaveTextDocument(() => {
            assert(false, "Callback not expected");
          });

          ExtensionProvider.getWSUtils()
            .openNote(testNote)
            .then(async () => {
              cmd.run();
            });
          // Small sleep to ensure callback doesn't fire.
          waitInMilliseconds(10).then(() => done());
        });
      }
    );

    describeMultiWS(
      "WHEN exporting a hierarchy scope",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS_MULTI.setupBasicMulti({ wsRoot, vaults });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[1],
            fname: "foo.test",
          });
        },
      },
      () => {
        test("THEN hierarchy note props should be in the export payload AND a note with a hierarchy match but in a different vault should not appear", async () => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );
          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Hierarchy,
          });

          // 'foo' note and its child: foo.test should not appear
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
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN workspace note props should be in the export payload", async () => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );
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
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
          sandbox = sinon.createSandbox();
        });

        afterEach(() => {
          sandbox.restore();
        });

        test("THEN lookup is prompted and lookup result should be the export payload", async () => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );
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

    describeMultiWS(
      "WHEN exporting a vault scope",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN quickpick is prompted and selected vault's notes shoul be export payload", async () => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );
          const engine = ExtensionProvider.getEngine();
          const { vaults } = engine;
          stubQuickPick(vaults[0]);
          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Vault,
          });
          expect(payload?.payload.length).toEqual(4);
        });
      }
    );
  });
});
