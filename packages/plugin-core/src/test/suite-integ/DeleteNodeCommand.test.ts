import {
  EngineDeletePayload,
  NoteChangeEntry,
  VaultUtils,
} from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { DeleteNodeCommand } from "../../commands/DeleteNodeCommand";
import { VSCodeUtils } from "../../utils";
import { getWSV2 } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this);

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
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

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
        const { engine } = getWSV2();
        expect(engine.notes["foo"].schema).toEqual(undefined);
        expect(noteFiles.length).toEqual(1);
        expect(noteFiles.sort()).toEqual(["root.schema.yml"]);
        done();
      },
    });
  });
});
