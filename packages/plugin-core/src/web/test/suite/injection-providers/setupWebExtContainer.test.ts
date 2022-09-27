import assert from "assert";
import _ from "lodash";
import sinon from "sinon";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { NoteLookupAutoCompleteCommand } from "../../../../commands/common/NoteLookupAutoCompleteCommand";
import { ITelemetryClient } from "../../../../telemetry/common/ITelemetryClient";
import { NativeTreeView } from "../../../../views/common/treeview/NativeTreeView";
import { CopyNoteURLCmd } from "../../../commands/CopyNoteURLCmd";
import { NoteLookupCmd } from "../../../commands/NoteLookupCmd";
import { setupWebExtContainer } from "../../../injection-providers/setupWebExtContainer";
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
    test("WHEN NoteLookupCmd is resolved THEN valid objects are returned without exceptions", async () => {
      await setupEnvironment();
      await setupWebExtContainer({
        extensionUri: URI.parse("dummy"),
        subscriptions: [] as vscode.Disposable[],
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

    test("WHEN CopyNoteURLCmd is resolved THEN valid objects are returned without exceptions", async () => {
      try {
        const cmd = container.resolve(CopyNoteURLCmd);
        assert(!_.isUndefined(cmd));
      } catch (error) {
        assert.fail(error as Error);
      }
    });

    test("WHEN NoteLookupAutoCompleteCommand is resolved THEN valid objects are returned without exceptions", async () => {
      try {
        const cmd = container.resolve(NoteLookupAutoCompleteCommand);
        assert(!_.isUndefined(cmd));
      } catch (error) {
        assert.fail(error as Error);
      }
    });

    test("WHEN NativeTreeView is resolved THEN valid objects are returned without exceptions", async () => {
      try {
        const obj = container.resolve(NativeTreeView);
        assert(!_.isUndefined(obj));
      } catch (error) {
        assert.fail(error as Error);
      }
    });

    test("WHEN ITelemetryClient is resolved THEN valid objects are returned without exceptions", async () => {
      try {
        const obj = container.resolve<ITelemetryClient>("ITelemetryClient");
        assert(!_.isUndefined(obj));
      } catch (error) {
        assert.fail(error as Error);
      }
    });
  }
);
