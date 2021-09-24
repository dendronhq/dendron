import { DVault } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { Snippets } from "@dendronhq/engine-server";
import path from "path";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Blank Workspace Initializer. Creates the barebones requirements for a functioning workspace
 */
export class BlankInitializer implements WorkspaceInitializer {
  createVaults(vault?: DVault) {
    const vaultPath = vault?.fsPath || "vault";
    return [{ fsPath: vaultPath }];
  }

  async onWorkspaceCreation(opts: {
    vaults: DVault[];
    wsRoot: string;
  }): Promise<void> {
    const vpath = vault2Path({ vault: opts.vaults[0], wsRoot: opts.wsRoot });

    // write snippets
    const vscodeDir = path.join(vpath, ".vscode");
    Snippets.create(vscodeDir);
  }
}
