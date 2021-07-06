import { DVault } from "@dendronhq/common-all";
import { GitUtils, simpleGit, SimpleGit } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { ProgressLocation, window } from "vscode";
import { VaultAddCommandOpts } from "../commands/VaultAddCommand";
import { GLOBAL_STATE, WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { DendronWorkspace } from "../workspace";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Seed Workspace Initializer
 */
 export class SeedInitializer implements WorkspaceInitializer {

  private git: SimpleGit | undefined;

  constructor() {
    // this.git = ;
    // this.git = simpleGit({ baseDir });
  }

  createVaults = () => {
    return [];
  };

  onWorkspaceCreation = async (opts: { vaults: DVault[]; wsRoot: string, svc?: WorkspaceService }) => {
    const ctx = "SeedInitializer.onWorkspaceCreation";

    const ws = DendronWorkspace.instance();
    
    await ws.updateGlobalState(
      GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
      WORKSPACE_ACTIVATION_CONTEXT.JOURNAL.toString()
    );

    // opts.svc!.addVault();

    this.git = simpleGit({baseDir: opts.wsRoot});

    await this.handleRemoteRepo({
      type: "remote",
      name: 'journal',
      path: 'journal',
      pathRemote: "https://github.com/dendronhq/template-journal.git",
      // pathRemote: "https://github.com/dendronhq/dendron-site.git",
      wsService: opts.svc!
    })

  };

  onWorkspaceOpen: (opts: { ws: DendronWorkspace }) => void = async (opts: {
    ws: DendronWorkspace;
  }) => {
    const ctx = "SeedInitializer.onWorkspaceOpen";

    // console.log("About to run vault add on dendron-site");

    // await new VaultAddCommand().execute({
    //   type: "remote",
    //   name: 'dendron',
    //   path: 'dendron',
    //   pathRemote: "https://github.com/dendronhq/dendron-site.git"
    // });

    // let rootUri = VSCodeUtils.joinPath(
    //   opts.ws.rootWorkspace.uri,
    //   "root.md"
    // );

    // if (fs.pathExistsSync(rootUri.fsPath)) {
    //   // Set the view to have the tutorial page showing with the preview opened to the side.
    //   await vscode.window.showTextDocument(rootUri);
    //   await MarkdownUtils.openPreview({ reuseWindow: false });
    // } else {
    //   Logger.error({
    //     ctx,
    //     error: new DendronError({ message: `Unable to find root.md` }),
    //   });
    // }
  };

  async handleRemoteRepo(
    opts: VaultAddCommandOpts & { wsService: WorkspaceService}
  ): Promise<{ vaults: DVault[] }> {
    const baseDir = opts.wsService.wsRoot;
    // const baseDir = DendronWorkspace.wsRoot();
    const { vaults } = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Fetching template",
        cancellable: false,
      },
      async (progress) => {
        progress.report({
          message: "cloning repo",
        });
        await this.git!.clone(opts.pathRemote!, opts.path);
        const { vaults, workspace } = GitUtils.getVaultsFromRepo({
          repoPath: path.join(baseDir, opts.path),
          wsRoot: baseDir,
          repoUrl: opts.pathRemote!,
        });
        if (_.size(vaults) === 1 && opts.name) {
          vaults[0].name = opts.name;
        }
        // add all vaults
        progress.report({
          message: "adding vault",
        });
        // const wsRoot = DendronWorkspace.wsRoot();
        // const wsService = new WorkspaceService({ wsRoot });

        if (workspace) {
          await opts.wsService.addWorkspace({ workspace });
          // await this.addWorkspaceToWorkspace(workspace);
        } else {
          await _.reduce(
            vaults,
            async (resp: any, vault: DVault) => {
              await resp;
              await opts.wsService.createVault({ vault });
              await opts.wsService.addVault({vault, updateWorkspace:true});
              // return this.addVaultToWorkspace(vault);
            },
            Promise.resolve()
          );
        }
        return { vaults };
      }
    );
    return { vaults };
  }
}