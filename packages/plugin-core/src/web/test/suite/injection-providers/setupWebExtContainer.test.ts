import assert from "assert";
import _ from "lodash";
import sinon from "sinon";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { CopyNoteURLCmd } from "../../../commands/CopyNoteURLCmd";
import { NoteLookupCmd } from "../../../commands/NoteLookupCmd";
import { setupWebExtContainer } from "../../../injection-providers/setupWebExtContainer";
import { NativeTreeView } from "../../../../common/NativeTreeView";
import { WorkspaceHelpers } from "../../helpers/WorkspaceHelpers";

async function setupEnvironment() {
  const wsRoot = await WorkspaceHelpers.getWSRootForTest();

  const config = {
    workspace: {
      vaults: [
        {
          fsPath: "test",
          name: "test-name",
        },
      ],
    },
  };

  await WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);

  sinon.replaceGetter(vscode.workspace, "workspaceFile", () =>
    Utils.joinPath(wsRoot, "test.code-workspace")
  );
}

/**
 * This test suite ensures that all objects in main (extension.ts) can be
 * properly resolved by the DI container from `setupWebExtContainer`
 */
suite(
  "GIVEN an injection container for the Dendron Web Extension configuration",
  () => {
    test("WHEN command(s) are constructed THEN valid objects are returned without exceptions", async () => {
      await setupEnvironment();
      await setupWebExtContainer({
        extensionUri: URI.parse("dummy"),
      } as vscode.ExtensionContext);

      try {
        const cmd = container.resolve(NoteLookupCmd);
        assert(!_.isUndefined(cmd));
      } catch (error) {
        assert.fail(error as Error);
      } finally {
        sinon.restore();
      }
    });

    test("WHEN CopyNoteURLCmd is constructed THEN valid objects are returned without exceptions", async () => {
      try {
        const cmd = container.resolve(CopyNoteURLCmd);
        assert(!_.isUndefined(cmd));
      } catch (error) {
        assert.fail(error as Error);
      }
    });

    test("WHEN NativeTreeView is constructed THEN valid objects are returned without exceptions", async () => {
      try {
        const obj = container.resolve(NativeTreeView);
        assert(!_.isUndefined(obj));
      } catch (error) {
        assert.fail(error as Error);
      }
    });
  }
);
