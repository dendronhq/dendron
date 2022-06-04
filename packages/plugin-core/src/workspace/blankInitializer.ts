import { DVault } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { Snippets } from "@dendronhq/engine-server";
import path from "path";
import {
  OnWorkspaceCreationOpts,
  WorkspaceInitializer,
} from "./workspaceInitializer";

/**
 * Blank Workspace Initializer. Creates the barebones requirements for a functioning workspace
 */
export class BlankInitializer implements WorkspaceInitializer {
  createVaults(wsVault?: DVault) {
    const vaultPath = wsVault?.fsPath || "vault";
    return { wsVault: { fsPath: vaultPath } };
  }

  async onWorkspaceCreation(opts: OnWorkspaceCreationOpts): Promise<void> {
    if (opts.wsVault) {
      const vpath = vault2Path({ vault: opts.wsVault, wsRoot: opts.wsRoot });
      // write snippets
      const vscodeDir = path.join(vpath, ".vscode");
      Snippets.create(vscodeDir);
    }
  }
}
