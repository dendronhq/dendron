import { SchemaUtils, VaultUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import * as vscode from "vscode";
import { SchemaWatcher } from "../../watchers/schemaWatcher";
import { getEngine } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("SchemaWatcher", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  describe("onDidChange", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ vaults, wsRoot }) => {
          const vault = vaults[0];
          const newSchema = SchemaUtils.create({ id: "two", vault });
          await NoteTestUtilsV4.modifySchemaByPath(
            { wsRoot, vault, fname: "foo" },
            (sm) => {
              sm.schemas["two"] = newSchema;
              return sm;
            }
          );
          const wsVaults = vaults.map((vault) => {
            const wsRaw = VaultUtils.toWorkspaceFolder(vault);
            return {
              ...wsRaw,
              uri: vscode.Uri.file(wsRaw.path),
              index: 0,
              name: VaultUtils.getName(vault),
            };
          });

          const watcher = new SchemaWatcher({ vaults: wsVaults });
          const root = vault2Path({ vault, wsRoot });
          const uri = vscode.Uri.file(
            SchemaUtils.getPath({ root, fname: "foo" })
          );
          await watcher.onDidChange(uri);
          const schema = getEngine().schemas["foo"];
          expect(schema.schemas["two"].id).toEqual(newSchema.id);
          done();
        },
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
      });
    });
  });
});
