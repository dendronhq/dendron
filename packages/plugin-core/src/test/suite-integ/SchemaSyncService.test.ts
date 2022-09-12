import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { before, describe } from "mocha";
import { ExtensionProvider } from "../../ExtensionProvider";
import { SchemaSyncService } from "../../services/SchemaSyncService";
import { expect } from "../testUtilsv2";

import * as vscode from "vscode";
import { describeMultiWS } from "../testUtilsV3";

suite("WHEN syncing schema", function () {
  let schemaSyncService: SchemaSyncService | undefined;

  describe("AND file is not new", () => {
    describeMultiWS(
      "AND edit is made",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        this.timeout(10e5);
        before(() => {
          schemaSyncService = new SchemaSyncService(
            ExtensionProvider.getExtension()
          );
        });

        test("THEN don't change file", async () => {
          const ext = ExtensionProvider.getExtension();
          const { data: schema } = await ext.getEngine().getSchema("foo");
          await ExtensionProvider.getWSUtils()
            .openSchema(schema!)
            .then(async (editor) => {
              await editor.edit((editBuilder) => {
                /**
                 * Results in the following text
                 * - id: ch1
                 * 	children: [{pattern: one}]
                 * 	title: ch1
                 */
                return editBuilder.insert(
                  new vscode.Position(9, 15),
                  "{pattern: one}"
                );
              });
              return editor.document.save().then(async () => {
                await schemaSyncService?.saveSchema({
                  uri: editor.document.uri,
                  isBrandNewFile: false,
                });

                // schema file wasn't edited in the process
                expect(editor.document.isDirty).toBeFalsy();
                expect(
                  editor.document
                    .getText()
                    .indexOf("children: [{pattern: one}]")
                ).toBeTruthy();
              });
            });
        });
      }
    );
  });
});
