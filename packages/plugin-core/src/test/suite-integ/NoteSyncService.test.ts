import { assert, DateTime, milliseconds, Time } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import { afterEach, describe } from "mocha";
import sinon from "sinon";
import * as vscode from "vscode";
import { EventEmitter, TextDocumentChangeEvent } from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import {
  INoteSyncService,
  NoteSyncService,
} from "../../services/NoteSyncService";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

async function wait1Millisecond(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1);
  });
}

/**
 * Returns current milliseconds and waits 1 millisecond to ensure
 * subsequent calls to this function will return different milliseconds. */
async function millisNowAndWait1Milli(): Promise<number> {
  const millis = milliseconds();
  await wait1Millisecond();
  return millis;
}

suite("NoteSyncService tests without time stubbing", function testSuite() {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  describe(`GIVEN NoteSyncService`, () => {
    let noteSyncSvc: INoteSyncService | undefined;

    afterEach(() => {
      if (noteSyncSvc) {
        noteSyncSvc.dispose();
      }
    });

    test("WHEN only fontmatter title changes THEN updated stamp should be changed.", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine }) => {
          const foo = engine.notes["foo"];
          const editor = await WSUtils.openNote(foo);
          let changeSelection: vscode.Selection;
          const offset = `title: `.length;
          await editor?.edit((builder) => {
            const startTitlePos = new vscode.Position(2, offset);
            const endTitlePos = new vscode.Position(
              2,
              `title: ${foo.title}`.length
            );
            changeSelection = new vscode.Selection(startTitlePos, endTitlePos);
            builder.replace(changeSelection, `bar`);
          });

          const beforeStamp = await millisNowAndWait1Milli();

          const emitter = new EventEmitter<TextDocumentChangeEvent>();

          noteSyncSvc = new NoteSyncService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument,
            emitter.event
          );

          noteSyncSvc.onNoteChange(
            async (noteProps) => {
              expect(noteProps.updated > beforeStamp).toBeTruthy();

              expect(
                await AssertUtils.assertInString({
                  body: engine.notes["foo"].title,
                  match: ["bar"],
                  nomatch: ["foo"],
                })
              ).toBeTruthy();

              done();
            },
            this
            // ctx.subscriptions
          );

          emitter.fire({
            document: editor.document,
            contentChanges: [
              {
                range: new vscode.Range(
                  changeSelection!.start.line,
                  changeSelection!.start.character,
                  changeSelection!.end.line,
                  changeSelection!.end.character
                ),
                text: "bar",
                rangeLength: 3,
                rangeOffset: offset,
              },
            ],
          });
        },
      });
    });
  });
});

suite("NoteSyncService", function testSuite() {
  let newUpdatedTime: number;
  let timeStub: sinon.SinonStub;

  let noteSyncSvc: INoteSyncService | undefined;

  afterEach(() => {
    if (noteSyncSvc) {
      noteSyncSvc.dispose();
    }
  });

  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {
      newUpdatedTime = 60000;
      timeStub = sinon
        .stub(Time, "now")
        .returns(DateTime.fromMillis(newUpdatedTime));
    },
    afterHook: () => {
      if (timeStub) {
        timeStub.restore();
      }
    },
  });

  describe("onDidChange", () => {
    test("ok: onDidChange: change", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine }) => {
          const foo = engine.notes["foo"];
          const editor = await WSUtils.openNote(foo);
          await editor?.edit((builder) => {
            const pos = new vscode.Position(10, 0);
            const selection = new vscode.Selection(pos, pos);
            builder.replace(selection, `Hello`);
          });

          const emitter = new EventEmitter<TextDocumentChangeEvent>();

          noteSyncSvc = new NoteSyncService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument,
            emitter.event
          );

          noteSyncSvc.onNoteChange(async (noteProps) => {
            expect(noteProps.contentHash).toEqual(
              "465a4f4ebf83fbea836eb7b8e8e040ec"
            );
            expect(noteProps.updated).toEqual(newUpdatedTime);
            expect(
              await AssertUtils.assertInString({
                body: engine.notes["foo"].body,
                match: ["Hello"],
              })
            ).toBeTruthy();

            done();
          }, this);

          emitter.fire({
            document: editor.document,
            contentChanges: [],
          });
        },
      });
    });

    test("onDidChange: changing `tags` updates links", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async (opts) => {
          await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
          await NoteTestUtilsV4.createNote({
            fname: "tags.test",
            wsRoot: opts.wsRoot,
            vault: opts.vaults[0],
          });
        },
        onInit: async ({ engine }) => {
          const foo = engine.notes["foo"];
          const editor = await WSUtils.openNote(foo);
          await editor?.edit((builder) => {
            const pos = new vscode.Position(6, 0);
            builder.insert(pos, `tags: test\n`);
          });

          const emitter = new EventEmitter<TextDocumentChangeEvent>();

          noteSyncSvc = new NoteSyncService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument,
            emitter.event
          );

          noteSyncSvc.onNoteChange(async (_noteProps) => {
            const updatedFoo = engine.notes["foo"];
            expect(updatedFoo.links.length).toEqual(1);
            expect(updatedFoo.links[0].type).toEqual("frontmatterTag");
            expect(updatedFoo.links[0].to?.fname).toEqual("tags.test");

            done();
          }, this);

          emitter.fire({
            document: editor.document,
            contentChanges: [],
          });
        },
      });
    });

    test("onDidChange: no change", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine }) => {
          const foo = engine.notes["foo"];
          const editor = await WSUtils.openNote(foo);

          const emitter = new EventEmitter<TextDocumentChangeEvent>();

          noteSyncSvc = new NoteSyncService(
            ExtensionProvider.getExtension(),
            vscode.workspace.onDidSaveTextDocument,
            emitter.event
          );

          noteSyncSvc.onNoteChange(async (_noteProps) => {
            assert(false, "Callback not expected");
          }, this);

          emitter.fire({
            document: editor.document,
            contentChanges: [],
          });

          // Small sleep to ensure callback doesn't fire.
          await millisNowAndWait1Milli();
          done();
        },
      });
    });
  });
});
