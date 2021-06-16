import { DVault } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";

export class TestWorkspaceUtils {
  static async create() {
    const wsRoot = tmpDir().name;
    const vaults: DVault[] = [{ fsPath: "vault1", workspace: "foo" }];
    await WorkspaceService.createWorkspace({ wsRoot, vaults });
  }
}
