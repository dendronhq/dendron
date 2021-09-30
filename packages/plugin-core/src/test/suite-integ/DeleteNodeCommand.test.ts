import {
  EngineDeletePayload,
  NoteChangeEntry,
  VaultUtils,
} from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { DeleteNodeCommand } from "../../commands/DeleteNodeCommand";
import { VSCodeUtils } from "../../utils";
import { getDWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { window } from "vscode";

suite("notes", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this);

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine, vaults, wsRoot }) => {
        const note = engine.notes["foo"];
        await VSCodeUtils.openNote(note);
        await new DeleteNodeCommand().execute();

        const vaultFiles = fs.readdirSync(
          path.join(wsRoot, VaultUtils.getRelPath(vaults[0]))
        );
        const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".md"));
        expect(noteFiles.sort()).toEqual(["bar.md", "foo.ch1.md", "root.md"]);
        done();
      },
    });
  });

  test("WHEN note is deleted THEN correct message is shown.", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const sinonSandbox = sinon.createSandbox();
        const windowSpy = sinonSandbox.spy(window, "showInformationMessage");

        const note = engine.notes["foo"];
        await VSCodeUtils.openNote(note);
        await new DeleteNodeCommand().execute();

        const infoMsg = windowSpy.getCall(0).args[0];
        expect(infoMsg).toEqual("foo.md (vault1) deleted");

        sinonSandbox.restore();
        done();
      },
    });
  });

  test("domain w/no children", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        const { wsRoot, vaults } = opts;
        const vaultRoot = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
        fs.removeSync(path.join(vaultRoot, "foo.ch1.md"));
      },
      onInit: async ({ engine, vaults, wsRoot }) => {
        const note = engine.notes["foo"];
        await VSCodeUtils.openNote(note);
        const resp = await new DeleteNodeCommand().execute();
        const changed = (resp as EngineDeletePayload).data as NoteChangeEntry[];
        const vaultDir = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
        const notes = engine.notes;
        expect(
          _.every(
            [
              {
                actual: changed[0].note.fname,
                expected: "root",
                msg: "root updated",
              },
              {
                actual: changed[0].note.children,
                expected: ["bar"],
                msg: "root has one child",
              },
              { actual: notes["foo"], expected: undefined },
              {
                actual: _.includes(fs.readdirSync(vaultDir), "foo.md"),
                expected: false,
              },
            ],
            (ent) => {
              if (!_.isEqual(ent.actual, ent.expected)) {
                throw `issue with ${JSON.stringify(ent)}`;
              }
              return true;
            }
          )
        ).toBeTruthy();

        done();
      },
    });
  });
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
