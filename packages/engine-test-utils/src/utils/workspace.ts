import { DVault } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";

export class TestWorkspaceUtils {
  static async create({
    wsRoot = tmpDir().name,
    vaults,
  }: {
    vaults: DVault[];
    wsRoot?: string;
  }) {
    return WorkspaceService.createWorkspace({ wsRoot, vaults });
  }
}
