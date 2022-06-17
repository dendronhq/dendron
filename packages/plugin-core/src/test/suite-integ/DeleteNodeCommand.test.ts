import { NoteProps, VaultUtils } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import {
  DeleteNodeCommand,
  DeleteNodeCommandOutput,
} from "../../commands/DeleteNodeCommand";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getDWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";
import { window } from "vscode";
import { NoteTestUtilsV4, SinonStubbedFn } from "@dendronhq/common-test-utils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { before, after } from "mocha";

suite("DeleteNodeCommand", function () {
  describeMultiWS(
    "WHEN deleting a single note",
    { preSetupHook: ENGINE_HOOKS.setupBasic },
    () => {
      let windowSpy: SinonStubbedFn<typeof window["showInformationMessage"]>;
      before(async () => {
        windowSpy = sinon.stub(window, "showInformationMessage");
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = engine.notes["foo"];
        await ExtensionProvider.getWSUtils().openNote(note);
        await new DeleteNodeCommand().execute({ noConfirm: true });
      });
      after(() => {
        windowSpy.restore();
      });

      test("THEN the note file is deleted", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vaultFiles = fs.readdirSync(
          path.join(wsRoot, VaultUtils.getRelPath(vaults[0]))
        );
        const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".md"));
        expect(noteFiles.sort()).toEqual(["bar.md", "foo.ch1.md", "root.md"]);
      });

      test("THEN the correct prompt is shown", () => {
        expect(windowSpy.calledOnce).toBeTruthy();
        expect(windowSpy.getCall(0).args[0]).toEqual("foo.md (vault1) deleted");
      });
    }
  );

  let activeNote: NoteProps;
  describeMultiWS(
    "WHEN a note with backlinks is deleted",
    {
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        activeNote = await NoteTestUtilsV4.createNote({
          fname: "note-to-be-deleted",
          vault: vaults[0],
          wsRoot,
        });

        await NoteTestUtilsV4.createNote({
          fname: "implicit-same-vault-link",
          vault: vaults[0],
          body: ["[[note-to-be-deleted]]", "[[dummy]]"].join("\n"),
          wsRoot,
        });

        await NoteTestUtilsV4.createNote({
          fname: "explicit-same-vault-link",
          vault: vaults[0],
          body: ["[[dendron://vault1/note-to-be-deleted]]", "[[dummy]]"].join(
            "\n"
          ),
          wsRoot,
        });

        await NoteTestUtilsV4.createNote({
          fname: "implicit-different-vault-link",
          vault: vaults[1],
          body: ["[[note-to-be-deleted]]", "[[dummy]]"].join("\n"),
          wsRoot,
        });

        await NoteTestUtilsV4.createNote({
          fname: "explicit-same-vault-link2",
          vault: vaults[1],
          body: ["[[dendron://vault1/note-to-be-deleted]]", "[[dummy]]"].join(
            "\n"
          ),
          wsRoot,
        });
      },
    },
    () => {
      test("THEN a preview of broken links is shown", async () => {
        await ExtensionProvider.getWSUtils().openNote(activeNote);
        const cmd = new DeleteNodeCommand();

        const sandbox = sinon.createSandbox();
        const previewSpy = sandbox.spy(cmd, "showNoteDeletePreview");

        await cmd.execute({ noConfirm: true });

        const previewArgs = previewSpy.getCall(0).args;
        const previewContent = await previewSpy.getCall(0).returnValue;

        expect(previewArgs[0].fname).toEqual("note-to-be-deleted");
        expect(previewArgs[0].vault).toEqual({ fsPath: "vault1" });
        expect(previewArgs[1].length).toEqual(4);
        expect(previewContent.includes("dummy")).toBeFalsy();
        sandbox.restore();
      });
    }
  );

  describeMultiWS(
    "WHEN deleting a domain without children",
    { preSetupHook: ENGINE_HOOKS.setupBasic },
    () => {
      let output: DeleteNodeCommandOutput;
      let windowSpy: SinonStubbedFn<typeof window["showInformationMessage"]>;
      before(async () => {
        windowSpy = sinon.stub(window, "showInformationMessage");
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = engine.notes["foo.ch1"];
        await ExtensionProvider.getWSUtils().openNote(note);
        output = await new DeleteNodeCommand().execute({ noConfirm: true });
      });
      after(() => {
        windowSpy.restore();
      });

      test("THEN the note file is deleted", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vaultFiles = await fs.readdir(
          path.join(wsRoot, VaultUtils.getRelPath(vaults[0]))
        );
        const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".md"));
        expect(noteFiles.sort()).toEqual(["bar.md", "foo.md", "root.md"]);
      });

      test("THEN the correct prompt is shown", () => {
        expect(windowSpy.calledOnce).toBeTruthy();
        expect(windowSpy.getCall(0).args[0]).toEqual(
          "foo.ch1.md (vault1) deleted"
        );
      });

      test("THEN the engine produces the correct changes", async () => {
        const notes = ExtensionProvider.getDWorkspace().engine.notes;
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vaultDir = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
        expect(output?.data).toBeTruthy();
        const changed = output!.data!;
        expect(
          _.every(
            [
              {
                actual: changed[0].note.fname,
                expected: "foo",
                msg: "foo updated",
              },
              {
                actual: changed[0].note.children,
                expected: [],
                msg: "foo has no children",
              },
              { actual: notes["foo.ch1"], expected: undefined },
              {
                actual: _.includes(await fs.readdir(vaultDir), "foo.ch1.md"),
                expected: false,
              },
            ],
            (ent) => {
              if (!_.isEqual(ent.actual, ent.expected)) {
                throw new Error(`issue with ${JSON.stringify(ent)}`);
              }
              return true;
            }
          )
        ).toBeTruthy();
      });
    }
  );
});

suite("schemas", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ vaults, wsRoot }) => {
        const vaultRoot = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
        const notePath = path.join(vaultRoot, "foo.schema.yml");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        await new DeleteNodeCommand().execute();

        const vaultFiles = fs.readdirSync(vaultRoot);
        const noteFiles = vaultFiles.filter((ent) =>
          ent.endsWith(".schema.yml")
        );
        const { engine } = getDWorkspace();
        expect(engine.notes["foo"].schema).toEqual(undefined);
        expect(noteFiles.length).toEqual(1);
        expect(noteFiles.sort()).toEqual(["root.schema.yml"]);
        done();
      },
    });
  });
});

suite("Contextual-UI", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  suite(
    "WHEN Delete Note is clicked from Context Menu for `foo.schema.yml`",
    () => {
      test("THEN `foo.schema.yml` must be deleted", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          onInit: async ({ vaults, wsRoot }) => {
            const vaultRoot = path.join(
              wsRoot,
              VaultUtils.getRelPath(vaults[0])
            );
            const opts = {
              _fsPath: path.join(vaultRoot, "foo.schema.yml"),
            };
            await new DeleteNodeCommand().execute(opts);

            const vaultFiles = fs.readdirSync(vaultRoot);
            const noteFiles = vaultFiles.filter((ent) =>
              ent.endsWith(".schema.yml")
            );
            const { engine } = getDWorkspace();
            expect(engine.notes["foo"].schema).toEqual(undefined);
            expect(noteFiles.length).toEqual(1);
            expect(noteFiles.sort()).toEqual(["root.schema.yml"]);
            done();
          },
        });
      });
    }
  );
  suite("WHEN Delete Note is clicked from Context Menu for `foo.md`", () => {
    test("THEN the `foo.md` must be deleted from the engine", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ vaults, wsRoot }) => {
          const vaultRoot = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
          const opts = {
            _fsPath: path.join(vaultRoot, "foo.md"),
            noConfirm: true,
          };
          await new DeleteNodeCommand().execute(opts);

          const vaultFiles = fs.readdirSync(
            path.join(wsRoot, VaultUtils.getRelPath(vaults[0]))
          );
          const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".md"));
          expect(noteFiles.sort()).toEqual(["bar.md", "foo.ch1.md", "root.md"]);
          done();
        },
      });
    });
  });
});
