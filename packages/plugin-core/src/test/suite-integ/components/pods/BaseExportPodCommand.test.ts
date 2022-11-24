import { assert, DVault, NoteProps, NoteUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  NoteTestUtilsV4,
  testAssertsInsideCallback,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import { PodExportScope } from "@dendronhq/pods-core";
import { after, afterEach, beforeEach, describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { PodUIControls } from "../../../../components/pods/PodControls";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import { VSCodeUtils } from "../../../../vsCodeUtils";
import { expect } from "../../../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  waitInMilliseconds,
} from "../../../testUtilsV3";
import { TestExportPodCommand } from "./TestExportCommand";

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
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;

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

          const vaults = ExtensionProvider.getDWorkspace().vaults;
          vaults.then((vaults) => {
            const testNote = NoteUtils.create({
              fname: "foo",
              vault: vaults[0],
            });
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
        });

        test("AND note is clean, THEN a onDidSaveTextDocument should not be fired", (done) => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );

          const vaults = ExtensionProvider.getDWorkspace().vaults;
          vaults.then((vaults) => {
            const testNote = NoteUtils.create({
              fname: "foo",
              vault: vaults[0],
            });
            const disposable = vscode.workspace.onDidSaveTextDocument(() => {
              assert(false, "Callback not expected");
            });

            ExtensionProvider.getWSUtils()
              .openNote(testNote)
              .then(async () => {
                cmd.run();
              });

            // Small sleep to ensure callback doesn't fire.
            waitInMilliseconds(10).then(async () => {
              disposable.dispose();
              done();
            });
          });
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
          const { vaults } = engine;
          const testNote1 = (
            await engine.findNotes({
              fname: "test-note-for-pod1",
              vault: vaults[0],
            })
          )[0];
          const testNote2 = (
            await engine.findNotes({
              fname: "test-note-for-pod2",
              vault: vaults[0],
            })
          )[0];
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

    describeSingleWS(
      "WHEN exporting with selection scope",
      {
        postSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN export payload must contain the selection as note body", async () => {
          const cmd = new TestExportPodCommand(
            ExtensionProvider.getExtension()
          );
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;
          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "root.md"
          );
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          if (editor) {
            editor.selection = new vscode.Selection(7, 0, 8, 0);
          }

          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Selection,
          });
          expect((payload?.payload as NoteProps[])[0].fname).toEqual("root");
          expect((payload?.payload as NoteProps[]).length).toEqual(1);
          expect(payload?.payload[0].body).toEqual("# Welcome to Dendron");
        });
      }
    );
  });
});
