// @ts-nocheck

import {
  NoteProps,
  NoteUtils,
  VaultUtils,
  WorkspaceOpts,
  Wrap,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4, FileTestUtils } from "@dendronhq/common-test-utils";
import { describe, before, beforeEach, afterEach } from "mocha";
import sinon from "sinon";
import path from "path";
import * as vscode from "vscode";
import { WorkspaceWatcher } from "../../WorkspaceWatcher";
import { WindowWatcher } from "../../windowWatcher";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  runSuiteButSkipForWindows,
} from "../testUtilsV3";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { Position } from "vscode";
import * as _ from "lodash";
import { WSUtils } from "../../WSUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { ExtensionProvider } from "../../ExtensionProvider";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { VSCodeUtils } from "../../vsCodeUtils";
import { MockPreviewProxy } from "../MockPreviewProxy";

const setupBasic = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "oldfile",
    body: "oldfile",
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo.one",
    body: `[[oldfile]]`,
  });
};

// eslint-disable-next-line camelcase
const UNSAFE_getWorkspaceWatcherPropsForTesting = (
  watcher: WorkspaceWatcher
) => {
  return watcher.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
};

const doesSchemaExist = (schemaId: string) => {
  const { engine } = ExtensionProvider.getDWorkspace();

  return _.values(engine.schemas).some((schObj) => {
    return !_.isUndefined(schObj.schemas[schemaId]);
  });
};

runSuiteButSkipForWindows()(
  "WorkspaceWatcher schema update tests",
  function () {
    describeMultiWS(
      "WHEN setup with schema",
      {
        preSetupHook: ENGINE_HOOKS.setupInlineSchema,
      },
      () => {
        test("AND new schema is schema file saved THEN schema is updated in engine.", async () => {
          const { engine } = ExtensionProvider.getDWorkspace();
          const testNote = engine.notes["foo"];
          expect(testNote).toBeTruthy();

          const opened = await WSUtils.openSchema(engine.schemas.plain_schema);

          expect(doesSchemaExist("new_schema")).toBeFalsy();

          await opened.edit((editBuilder) => {
            const line = opened.document.getText().split("\n").length;

            const newElement = [`  - id: new_schema`, `    parent: root`].join(
              "\n"
            );

            editBuilder.insert(new Position(line, 0), newElement);
          });

          // The save should trigger workspace watcher but for some reason within tests
          // its not triggering onDidSaveTextDocument event (although it works within manual testing).
          // So for now we will call the instance of SchemaSyncService to make
          // sure at least that is working as expected.
          expect(await opened.document.save()).toBeTruthy();
          await ExtensionProvider.getExtension().schemaSyncService.onDidSave({
            document: opened.document,
          });

          expect(doesSchemaExist("new_schema")).toBeTruthy();
        });
      }
    );
  }
);

suite("WorkspaceWatcher", function () {
  let watcher: WorkspaceWatcher;

  describeSingleWS(
    "GIVEN a basic setup on a single vault workspace",
    {
      postSetupHook: setupBasic,
    },
    () => {
      test("WHEN user renames a file outside of dendron rename command, THEN all of its references are also updated", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const previewProxy = new MockPreviewProxy();
        const extension = ExtensionProvider.getExtension();

        const windowWatcher = new WindowWatcher({
          extension,
          previewProxy,
        });

        watcher = new WorkspaceWatcher({
          schemaSyncService: ExtensionProvider.getExtension().schemaSyncService,
          extension,
          windowWatcher,
        });
        const oldPath = path.join(
          wsRoot,
          VaultUtils.getRelPath(vaults[0]),
          "oldfile.md"
        );
        const oldUri = vscode.Uri.file(oldPath);
        const newPath = path.join(
          wsRoot,
          VaultUtils.getRelPath(vaults[0]),
          "newfile.md"
        );
        const newUri = vscode.Uri.file(newPath);
        const args: vscode.FileWillRenameEvent = {
          files: [
            {
              oldUri,
              newUri,
            },
          ],
          // eslint-disable-next-line no-undef
          waitUntil: (_args: Thenable<any>) => {
            _args.then(async () => {
              const reference = (
                await engine.findNotes({
                  fname: "foo.one",
                  vault: vaults[0],
                })
              )[0];
              expect(reference.body).toEqual(`[[newfile]]`);
            });
          },
        };

        watcher.onWillRenameFiles(args);
      });
    }
  );

  describeSingleWS(
    "GIVEN a basic setup on a single vault workspace",
    {
      postSetupHook: setupBasic,
    },
    () => {
      test("WHEN user renames a file outside of dendron rename command, THEN the title of fileName is also updated", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const previewProxy = new MockPreviewProxy();
        const extension = ExtensionProvider.getExtension();

        const windowWatcher = new WindowWatcher({
          extension,
          previewProxy,
        });
        watcher = new WorkspaceWatcher({
          schemaSyncService: ExtensionProvider.getExtension().schemaSyncService,
          extension,
          windowWatcher,
        });
        const oldPath = path.join(wsRoot, vaults[0].fsPath, "oldfile.md");
        const oldUri = vscode.Uri.file(oldPath);
        const newPath = path.join(wsRoot, vaults[0].fsPath, "newfile.md");
        const newUri = vscode.Uri.file(newPath);
        const args: vscode.FileRenameEvent = {
          files: [
            {
              oldUri,
              newUri,
            },
          ],
        };
        const edit = new vscode.WorkspaceEdit();
        edit.renameFile(oldUri, newUri);
        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
          await watcher.onDidRenameFiles(args);
          const newFile = (
            await engine.findNotes({
              fname: "newfile",
              vault: vaults[0],
            })
          )[0];
          expect(newFile.title).toEqual(`Newfile`);
        }
      });
    }
  );

  describeSingleWS(
    "GIVEN a basic setup on a single vault workspace",
    {
      postSetupHook: setupBasic,
    },
    () => {
      test("WHEN user saves a file and content has not changed, THEN updated timestamp in frontmatter is not updated", async () => {
        const engine = ExtensionProvider.getEngine();
        const previewProxy = new MockPreviewProxy();
        const extension = ExtensionProvider.getExtension();

        const windowWatcher = new WindowWatcher({
          extension,
          previewProxy,
        });
        watcher = new WorkspaceWatcher({
          schemaSyncService: ExtensionProvider.getExtension().schemaSyncService,
          extension,
          windowWatcher,
        });
        const fooNote = engine.notes["foo.one"];
        const updatedBefore = fooNote.updated;
        const editor = await ExtensionProvider.getWSUtils().openNote(fooNote);
        const vscodeEvent: vscode.TextDocumentWillSaveEvent = {
          document: editor.document,
        };
        const changes = watcher.onWillSaveTextDocument(vscodeEvent);
        expect(changes).toBeTruthy();
        expect(changes?.changes.length).toEqual(0);
        expect(fooNote.updated).toEqual(updatedBefore);
      });

      test("WHEN user saves a file and content has changed, THEN updated timestamp in frontmatter is updated", (done) => {
        const engine = ExtensionProvider.getEngine();
        const previewProxy = new MockPreviewProxy();
        const extension = ExtensionProvider.getExtension();

        const windowWatcher = new WindowWatcher({
          extension,
          previewProxy,
        });
        watcher = new WorkspaceWatcher({
          schemaSyncService: ExtensionProvider.getExtension().schemaSyncService,
          extension,
          windowWatcher,
        });
        const fooNote = engine.notes["foo.one"];
        const bodyBefore = fooNote.body;
        const updatedBefore = fooNote.updated;
        const textToAppend = "new text here";
        ExtensionProvider.getWSUtils()
          .openNote(fooNote)
          .then((editor) => {
            editor.edit((editBuilder) => {
              const line = editor.document.getText().split("\n").length;
              editBuilder.insert(new vscode.Position(line, 0), textToAppend);
            });
            editor.document.save().then(() => {
              const vscodeEvent: vscode.TextDocumentWillSaveEvent = {
                document: editor.document,
                // eslint-disable-next-line no-undef
                waitUntil: (_args: Thenable<any>) => {
                  _args.then(() => {
                    // Engine note body hasn't been updated yet
                    expect(engine.notes["foo.one"].body).toEqual(bodyBefore);
                    expect(engine.notes["foo.one"].updated).toNotEqual(
                      updatedBefore
                    );
                    done();
                  });
                },
              };
              const changes = watcher.onWillSaveTextDocument(vscodeEvent);
              expect(changes).toBeTruthy();
              expect(changes?.changes.length).toEqual(1);
            });
          });
      });
    }
  );

  describe("GIVEN the user opening a file", () => {
    let ext: IDendronExtension;
    let workspaceWatcher: WorkspaceWatcher;

    beforeEach(async () => {
      ext = ExtensionProvider.getExtension();
      const previewProxy = new MockPreviewProxy();

      const windowWatcher = new WindowWatcher({
        extension: ext,
        previewProxy,
      });

      workspaceWatcher = new WorkspaceWatcher({
        schemaSyncService: ext.schemaSyncService,
        extension: ext,
        windowWatcher,
      });
    });
    afterEach(async () => {
      // imporant since we activate workspace watchers
      await ext.deactivate();
    });
    describeSingleWS(
      "AND WHEN user opens non dendron file for the first time",
      {},
      () => {
        test("THEN do not affect frontmatter", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          await FileTestUtils.createFiles(wsRoot, [{ path: "sample" }]);
          const notePath = path.join(wsRoot, "sample");
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          const { onFirstOpen } =
            UNSAFE_getWorkspaceWatcherPropsForTesting(workspaceWatcher);
          expect(await onFirstOpen(editor)).toBeFalsy();
        });
      }
    );

    describeSingleWS(
      "AND WHEN user opens non dendron markdown file for the first time",
      {},
      () => {
        test("THEN do not affect frontmatter", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          await FileTestUtils.createFiles(wsRoot, [{ path: "sample.md" }]);
          const notePath = path.join(wsRoot, "sample.md");
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          const { onFirstOpen } =
            UNSAFE_getWorkspaceWatcherPropsForTesting(workspaceWatcher);
          expect(await onFirstOpen(editor)).toBeFalsy();
        });
      }
    );

    describeSingleWS(
      "WHEN user opens dendron note for the first time",
      {},
      () => {
        let note: NoteProps;
        before(async () => {
          const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
          note = await NoteTestUtilsV4.createNoteWithEngine({
            engine,
            fname: "test",
            vault: vaults[0],
            wsRoot,
          });
        });
        test("THEN the cursor moves past the frontmatter", async () => {
          const ext = ExtensionProvider.getExtension();
          const wsutils = new WSUtilsV2(ext);
          const editor = await wsutils.openNote(note);
          const { onFirstOpen } =
            UNSAFE_getWorkspaceWatcherPropsForTesting(workspaceWatcher);

          const stubTimeout = sinon.stub(Wrap, "setTimeout");
          expect(await onFirstOpen(editor)).toBeTruthy();
          stubTimeout.callArg(0);
          // the selection should have been moved past the frontmatter
          const { line, character } = editor.selection.active;
          expect(line).toEqual(7);
          expect(character).toEqual(3);
          stubTimeout.restore();
        });
      }
    );

    describeSingleWS(
      "WHEN the user opens the file through the search",
      {},
      () => {
        let note: NoteProps;
        before(async () => {
          const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
          note = await NoteTestUtilsV4.createNoteWithEngine({
            engine,
            fname: "test",
            vault: vaults[0],
            wsRoot,
          });
        });
        test("THEN the cursor moves past the frontmatter", async () => {
          const stubTimeout = sinon.stub(Wrap, "setTimeout");
          const editor = await WSUtils.openNote(note);
          // pre-move the selection, like what would happen when opening through the serach
          editor.selection = new vscode.Selection(5, 0, 5, 0);
          WorkspaceWatcher.moveCursorPastFrontmatter(editor);
          stubTimeout.callArg(0);
          // the selection didn't move from what it was before
          const { line, character } = editor.selection.active;
          expect(line).toEqual(5);
          expect(character).toEqual(0);
          stubTimeout.restore();
        });
      }
    );
  });
});
