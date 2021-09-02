import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import {
  CommandOutput,
  SchemaLookupCommand,
} from "../../commands/SchemaLookupCommand";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("SchemaLookupCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  describe("basics", () => {
    test("lookup existing schema", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async () => {
          const cmd = new SchemaLookupCommand();

          await cmd.run({ noConfirm: true, initialValue: "foo" });
          const editor = VSCodeUtils.getActiveTextEditor();
          expect(editor).toBeTruthy();
          const fileName = editor!.document.fileName;
          const basename = path.basename(fileName, ".yml");
          expect(basename).toEqual("foo.schema");
          done();
        },
      });
    });

    describe("updateItems", () => {
      test("star query", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          },
          onInit: async () => {
            const cmd = new SchemaLookupCommand();
            const { quickpick } = (await cmd.run({
              noConfirm: true,
              initialValue: "*",
            })) as CommandOutput;
            expect(quickpick.selectedItems.length).toEqual(2);
            done();
          },
        });
      });
    });

    test("lookup new schema", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async () => {
          const cmd = new SchemaLookupCommand();

          await cmd.run({ noConfirm: true, initialValue: "baz" });
          const editor = VSCodeUtils.getActiveTextEditor();
          expect(editor).toBeTruthy();
          const fileName = editor!.document.fileName;
          const basename = path.basename(fileName, ".yml");
          expect(basename).toEqual("baz.schema");
          done();
        },
      });
    });

    test("lookup new schema assumes vault of open note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const cmd = new SchemaLookupCommand();
          const fooNote = engine.notes["foo"];
          await VSCodeUtils.openNote(fooNote);
          await cmd.run({ noConfirm: true, initialValue: "baz" });
          const editor = VSCodeUtils.getActiveTextEditor();
          expect(editor).toBeTruthy();
          const fileName = editor!.document.fileName;
          const basename = path.basename(fileName, ".yml");
          expect(basename).toEqual("baz.schema");
          const bazSchemaModule = engine.schemas["baz"];
          expect(bazSchemaModule.vault.fsPath).toEqual(fooNote.vault.fsPath);
          done();
        },
      });
    });

    test("picker items populated with existing schemas", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const cmd = new SchemaLookupCommand();
          const gatherOut = await cmd.gatherInputs({
            noConfirm: true,
          });
          const enrichOut = await cmd.enrichInputs(gatherOut);
          const selectedItems = enrichOut?.quickpick.selectedItems;
          const selectedItemIds = selectedItems?.map((item) => item.id);
          expect(selectedItemIds).toEqual(_.keys(engine.schemas));
          done();
        },
      });
    });
  });
});
