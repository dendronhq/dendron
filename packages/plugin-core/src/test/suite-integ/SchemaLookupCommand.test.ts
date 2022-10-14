import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import {
  CommandOutput,
  SchemaLookupCommand,
} from "../../commands/SchemaLookupCommand";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import {
  describeSingleWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

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
          cmd.cleanUp();
          done();
        },
      });
    });

    describeSingleWS(
      "WHEN performing a multilevel schema lookup",
      {
        postSetupHook: ENGINE_HOOKS.setupBasic,
        ctx,
      },
      () => {
        test("THEN proper information message is shown", async () => {
          const windowSpy = sinon.spy(vscode.window, "showInformationMessage");
          const cmd = new SchemaLookupCommand();

          await cmd.run({ noConfirm: true, initialValue: "foo.test" });
          const infoMsg = windowSpy.getCall(0).args[0];
          expect(infoMsg).toEqual(
            "It looks like you are trying to create a multi-level [schema](https://wiki.dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html). This is not supported. If you are trying to create a note instead, run the `> Note Lookup` command or click on `Note Lookup`"
          );
          cmd.cleanUp();
        });
      }
    );

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
            cmd.cleanUp();
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
          const fooNote = (await engine.getNoteMeta("foo")).data!;
          await WSUtils.openNote(fooNote);
          await cmd.run({ noConfirm: true, initialValue: "baz" });
          const editor = VSCodeUtils.getActiveTextEditor();
          expect(editor).toBeTruthy();
          const fileName = editor!.document.fileName;
          const basename = path.basename(fileName, ".yml");
          expect(basename).toEqual("baz.schema");
          const bazSchemaModule = (await engine.getSchema("baz")).data;
          expect(bazSchemaModule?.vault.fsPath).toEqual(fooNote.vault.fsPath);
          cmd.cleanUp();
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
          expect(selectedItemIds).toEqual(
            _.map(
              (await engine.querySchema("*")).data,
              (schema) => schema.fname
            )
          );
          cmd.cleanUp();
          done();
        },
      });
    });
  });
});
