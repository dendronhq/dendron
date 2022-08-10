import assert from "assert";
import _ from "lodash";
import sinon from "sinon";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { Utils } from "vscode-uri";
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

suite(
  "GIVEN an injection container for the Dendron Web Extension configuration",
  () => {
    test("WHEN command(s) are constructed THEN valid objects are returned without exceptions", async () => {
      await setupEnvironment();
      await setupWebExtContainer();

      try {
        const cmd = container.resolve(NoteLookupCmd);

        assert(!_.isUndefined(cmd));
      } catch (error) {
        assert.fail(error as Error);
      }
    });
  }
);
