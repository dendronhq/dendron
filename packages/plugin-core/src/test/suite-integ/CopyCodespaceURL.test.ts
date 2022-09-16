import { GitUtils, tmpDir, vault2Path } from "@dendronhq/common-server";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import path from "path";
import sinon from "sinon";
import { CopyCodespaceURL } from "../../commands/CopyCodespaceURL";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";
import * as vscode from "vscode";

describeSingleWS(
  "When Copy Codespace URL is run",
  {
    // these tests can run longer than 5s timeout;
    timeout: 1e6,
  },
  () => {
    test("THEN codespace url is copied to the clipboard", async () => {
      const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
      sinon
        .stub(GitUtils, "getGitProviderOwnerAndRepository")
        .resolves(["dendronhq", "dendron"]);
      const workspaces = vscode.workspace.workspaceFolders!;
      sinon.stub(vscode.workspace, "getWorkspaceFolder").returns(workspaces[0]);
      const remoteDir = tmpDir().name;
      await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
      const cmd = new CopyCodespaceURL();
      const notePath = path.join(
        vault2Path({ vault: vaults[0], wsRoot }),
        "root.md"
      );
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const resp = await cmd.execute({});
      expect(resp).toContain("https://github.dev/dendronhq/dendron/blob/");
    });
  }
);
