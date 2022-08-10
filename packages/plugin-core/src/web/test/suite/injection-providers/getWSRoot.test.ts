import assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import { getWSRoot } from "../../../injection-providers/getWSRoot";
import { WorkspaceHelpers } from "../../helpers/WorkspaceHelpers";

suite("GIVEN a workspace", () => {
  test("WHEN a code-workspace file is opened THEN the getWSRoot injector returns the workspace root URI correctly", async () => {
    const wsRoot = await WorkspaceHelpers.getWSRootForTest();

    sinon.replaceGetter(vscode.workspace, "workspaceFile", () =>
      Utils.joinPath(wsRoot, "test.code-workspace")
    );

    const returnedRoot = await getWSRoot();

    assert.notStrictEqual(returnedRoot, wsRoot);

    sinon.restore();
  });

  // TODO: Add tests for non code-workspace environments (multiple folders opened)
});
