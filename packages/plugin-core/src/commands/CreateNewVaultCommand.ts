import {
  asyncLoopOneAtATime,
  ConfigUtils,
  CONSTANTS,
  DendronError,
  DVault,
  DWorkspace,
  IntermediateDendronConfig,
  SelfContainedVault,
  VaultRemoteSource,
  VaultUtils,
  WorkspaceEvents,
} from "@dendronhq/common-all";
import {
  DConfig,
  GitUtils,
  pathForVaultRoot,
  simpleGit,
} from "@dendronhq/common-server";
import {
  Git,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  commands,
  OpenDialogOptions,
  ProgressLocation,
  QuickPickItem,
  Uri,
  window,
} from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS, DENDRON_REMOTE_VAULTS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { PluginFileUtils } from "../utils/files";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  type: VaultRemoteSource;
  path: string;
  pathRemote?: string;
  name?: string;
  isSelfContained?: boolean;
};

type CommandOutput = { vaults: DVault[] };

export { CommandOpts as VaultAddCommandOpts };

type SourceQuickPickEntry = QuickPickItem & { src: string };

enum VaultType {
  LOCAL = "local",
  REMOTE = "remote",
}

export class CreateNewVaultCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_NEW_VAULT.key;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  generateRemoteEntries = (): SourceQuickPickEntry[] => {
    return DENDRON_REMOTE_VAULTS.map(
      ({ name: label, description, data: src }): SourceQuickPickEntry => {
        return { label, description, src };
      }
    ).concat([
      {
        label: "custom",
        description: "custom endpoint",
        alwaysShow: true,
        src: "",
      },
    ]);
  };

  /** A regular, non-self contained vault. */
  async gatherVaultStandard(
    sourceType: VaultRemoteSource,
    vaultDestination: string
  ): Promise<CommandOpts | undefined> {
    let sourceName: string | undefined;
    if (sourceType === VaultType.REMOTE) {
      // eslint-disable-next-line  no-async-promise-executor
      const out = new Promise<CommandOpts | undefined>(async (resolve) => {
        const qp = VSCodeUtils.createQuickPick<SourceQuickPickEntry>();
        qp.ignoreFocusOut = true;
        qp.placeholder = "choose a preset or enter a custom git endpoint";
        qp.items = this.generateRemoteEntries();
        qp.onDidAccept(async () => {
          const value = qp.value;
          const selected = qp.selectedItems[0];
          if (selected.label === "custom") {
            if (PickerUtilsV2.isInputEmpty(value)) {
              return window.showInformationMessage("please enter an endpoint");
            }
            selected.src = qp.value;
          }
          const sourceRemotePath = selected.src;
          const path2Vault =
            selected.label === "custom"
              ? GitUtils.getRepoNameFromURL(sourceRemotePath)
              : selected.label;
          const placeHolder = path2Vault;
          sourceName = await VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
            value: placeHolder,
          });
          qp.hide();
          return resolve({
            type: sourceType!,
            name: sourceName,
            path: vaultDestination,
            pathRemote: sourceRemotePath,
          });
        });
        qp.show();
      });
      return out;
    }
    sourceName = await VSCodeUtils.showInputBox({
      prompt: "Name of new vault (optional, press enter to skip)",
    });
    return {
      type: sourceType,
      name: sourceName,
      path: vaultDestination,
    };
  }

  async gatherDestinationFolder() {
    const defaultUri = Uri.file(this._ext.getDWorkspace().wsRoot);
    // Prompt user where to create new vault
    const options: OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Select Vault Destination",
      canSelectFiles: false,
      canSelectFolders: true,
      defaultUri,
    };
    const folder = await VSCodeUtils.openFilePicker(options);
    if (_.isUndefined(folder)) {
      return;
    }
    return folder;
  }

  async gatherVaultSelfContained(
    sourceType: VaultRemoteSource,
    vaultDestination: string
  ): Promise<CommandOpts | undefined> {
    // If the vault name already exists, creating a vault with the same name would break things

    if (sourceType === VaultType.LOCAL) {
      // Local vault
      const sourceName = await VSCodeUtils.showInputBox({
        prompt: "Name of new vault (optional, press enter to skip)",
      });

      return {
        type: sourceType,
        name: sourceName,
        path: vaultDestination,
        isSelfContained: true,
      };
    } else {
      // Remote vault
      const remote = await VSCodeUtils.showInputBox({
        title: "Remote URL",
        prompt: "Enter the URL for the git remote",
        placeHolder: "git@github.com:dendronhq/dendron.git",
        ignoreFocusOut: true,
      });
      // Cancelled
      if (PickerUtilsV2.isInputEmpty(remote)) return;

      // Calculate the vault name from the remote.
      const vaultName: string | undefined = GitUtils.getRepoNameFromURL(remote);

      const sourceName = await VSCodeUtils.showInputBox({
        prompt: "Name of new vault (optional, press enter to skip)",
        value: vaultName,
      });

      return {
        type: sourceType,
        name: sourceName,
        path: vaultDestination,
        pathRemote: remote,
        isSelfContained: true,
      };
    }
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const sourceTypeSelected = await VSCodeUtils.showQuickPick([
      { label: VaultType.LOCAL, picked: true },
      { label: VaultType.REMOTE },
    ]);
    if (!sourceTypeSelected) {
      return;
    }
    const sourceType = sourceTypeSelected.label;
    const vaultDestination = await this.gatherDestinationFolder();
    if (!vaultDestination) return;

    const { config } = this._ext.getDWorkspace();
    if (config.dev?.enableSelfContainedVaults) {
      return this.gatherVaultSelfContained(sourceType, vaultDestination);
    } else {
      // A "standard", non self contained vault
      return this.gatherVaultStandard(sourceType, vaultDestination);
    }
  }

  async handleRemoteRepo(
    opts: CommandOpts
  ): Promise<{ vaults: DVault[]; workspace?: DWorkspace }> {
    const { vaults, workspace } = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Adding remote vault",
        cancellable: false,
      },
      async (progress) => {
        progress.report({
          message: "cloning repo",
        });
        const baseDir = this._ext.getDWorkspace().wsRoot;
        const git = simpleGit({ baseDir });
        await git.clone(opts.pathRemote!, opts.path);
        const { vaults, workspace } = await GitUtils.getVaultsFromRepo({
          repoPath: opts.path,
          wsRoot: this._ext.getDWorkspace().wsRoot,
          repoUrl: opts.pathRemote!,
        });
        if (_.size(vaults) === 1 && opts.name) {
          vaults[0].name = opts.name;
        }
        // add all vaults
        progress.report({
          message: "adding vault",
        });
        const wsRoot = this._ext.getDWorkspace().wsRoot;
        const wsService = new WorkspaceService({ wsRoot });

        if (workspace) {
          await wsService.addWorkspace({ workspace });
          await this.addWorkspaceToWorkspace(workspace);
        } else {
          // Some things, like updating config, can't be parallelized so needs to be done one at a time
          for (const vault of vaults) {
            // eslint-disable-next-line no-await-in-loop
            await wsService.createVault({ vault });
            // eslint-disable-next-line no-await-in-loop
            await this.addVaultToWorkspace(vault);
          }
        }
        return { vaults, workspace };
      }
    );
    return { vaults, workspace };
  }

  async handleRemoteRepoSelfContained(
    opts: CommandOpts
  ): Promise<{ vaults: DVault[] }> {
    return window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Adding remote vault",
        cancellable: false,
      },
      async (progress) => {
        const { wsRoot } = this._ext.getDWorkspace();
        progress.report({
          message: "cloning repo",
          increment: 0,
        });
        const { name, pathRemote: remoteUrl } = opts;
        const localUrl = opts.path;
        if (!remoteUrl) {
          throw new DendronError({
            message:
              "Remote vault has no remote set. This should never happen, please send a bug report if you encounter this.",
          });
        }

        await fs.ensureDir(localUrl);
        const git = new Git({ localUrl, remoteUrl });
        // `.` so it clones into the `localUrl` directory, not into a subdirectory of that
        await git.clone(".");
        const { vaults, workspace } = await GitUtils.getVaultsFromRepo({
          repoPath: localUrl,
          wsRoot,
          repoUrl: remoteUrl,
        });
        if (_.size(vaults) === 1 && name) {
          vaults[0].name = name;
        }
        // add all vaults
        const increment = 100 / (vaults.length + 1);
        progress.report({
          message:
            vaults.length === 1
              ? "adding vault"
              : `adding ${vaults.length} vaults`,
          increment,
        });
        const wsService = new WorkspaceService({ wsRoot });

        if (workspace) {
          // This is a backwards-compatibility fix until workspace vaults are
          // deprecated. If what we cloned was a workspace, then move it where
          // Dendron expects it, because we can't override the path.
          const clonedWSPath = path.join(wsRoot, workspace.name);
          await fs.move(localUrl, clonedWSPath);
          // Because we moved the workspace, we also have to recompute the vaults config.
          workspace.vaults = (
            await GitUtils.getVaultsFromRepo({
              repoPath: clonedWSPath,
              repoUrl: remoteUrl,
              wsRoot,
            })
          ).vaults;
          // Then handle the workspace vault as usual, without self contained vault stuff
          await wsService.addWorkspace({ workspace });
          await this.addWorkspaceToWorkspace(workspace);
        } else {
          // Some things, like updating config, can't be parallelized so needs
          // to be done one at a time
          await asyncLoopOneAtATime(vaults, async (vault) => {
            if (VaultUtils.isSelfContained(vault)) {
              await this.checkAndWarnTransitiveDeps({ vault, wsRoot });
              await wsService.createSelfContainedVault({
                vault,
                addToConfig: true,
                newVault: false,
              });
            } else {
              await wsService.createVault({ vault });
            }
            await this.addVaultToWorkspace(vault);
            progress.report({ increment });
          });
        }
        wsService.dispose();
        return { vaults, workspace };
      }
    );
  }

  /** If a self contained vault contains transitive dependencies, warn the user
   * that they won't be accessible.
   *
   * Adding transitive deps is not supported yet, this check can be removed once
   * support is added.
   */
  async checkAndWarnTransitiveDeps(opts: {
    vault: SelfContainedVault;
    wsRoot: string;
  }) {
    const vaultRootPath = pathForVaultRoot(opts);
    try {
      if (
        await fs.pathExists(
          path.join(vaultRootPath, CONSTANTS.DENDRON_CONFIG_FILE)
        )
      ) {
        const vaultConfig = DConfig.getRaw(
          vaultRootPath
        ) as IntermediateDendronConfig;
        if (ConfigUtils.getVaults(vaultConfig)?.length > 1) {
          await AnalyticsUtils.trackForNextRun(
            WorkspaceEvents.TransitiveDepsWarningShow
          );
          // Wait for the user to accept the prompt, otherwise window will
          // reload before they see the warning
          const openDocsOption = "Open documentation & continue";
          const select = await VSCodeUtils.showMessage(
            MessageSeverity.WARN,
            "The vault you added depends on other vaults, which is not supported.",
            {
              modal: true,
              detail:
                "You may be unable to access these transitive vaults. The vault itself should continue to work. Please see for [details]()",
            },
            {
              title: "Continue",
              isCloseAffordance: true,
            },
            { title: openDocsOption }
          );
          if (select?.title === openDocsOption) {
            // Open a page in the default browser that describes what transitive
            // dependencies are, and how to add them.
            await PluginFileUtils.openWithDefaultApp(
              "https://wiki.dendron.so/notes/q9yo0y7czv8mxlkbnw1ugj1"
            );
          }
        }
      }
    } catch (err) {
      // If anything does fail, ignore the error. This check is not crucial to
      // adding a vault, it's better if we let the user keep adding.
      Logger.warn({
        ctx: "VaultAddCommand.handleRemoteRepoSelfContained",
        err,
      });
    }
  }

  async addWorkspaceToWorkspace(workspace: DWorkspace) {
    const wsRoot = this._ext.getDWorkspace().wsRoot;
    const vaults = workspace.vaults;
    // Some things, like updating workspace file, can't be parallelized so needs to be done one at a time
    for (const vault of vaults) {
      // eslint-disable-next-line no-await-in-loop
      await this.addVaultToWorkspace(vault);
    }
    // add to gitignore
    await GitUtils.addToGitignore({
      addPath: workspace.name,
      root: wsRoot,
      noCreateIfMissing: true,
    });

    const workspaceDir = path.join(wsRoot, workspace.name);
    await fs.ensureDir(workspaceDir);
    await GitUtils.addToGitignore({
      addPath: ".dendron.cache.*",
      root: workspaceDir,
    });
  }

  async addVaultToWorkspace(vault: DVault) {
    return WorkspaceUtils.addVaultToWorkspace({
      vault,
      wsRoot: this._ext.getDWorkspace().wsRoot,
    });
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "CreateVaultCommand";
    let vaults: DVault[] = [];
    Logger.info({ ctx, msg: "enter", opts });
    if (opts.type === VaultType.REMOTE) {
      if (opts.isSelfContained) {
        ({ vaults } = await this.handleRemoteRepoSelfContained(opts));
      } else {
        ({ vaults } = await this.handleRemoteRepo(opts));
      }
    } else {
      const wsRoot = this._ext.getDWorkspace().wsRoot;
      const fsPath = VaultUtils.normVaultPath({
        vault: { fsPath: opts.path },
        wsRoot,
      });
      const wsService = new WorkspaceService({ wsRoot });
      const vault: DVault = {
        fsPath,
      };
      // Make sure these don't get set to undefined, or serialization breaks
      if (opts.isSelfContained) {
        vault.selfContained = true;
      }
      if (opts.name) {
        vault.name = opts.name;
      }

      if (VaultUtils.isSelfContained(vault)) {
        await wsService.createSelfContainedVault({
          vault,
          addToConfig: true,
          addToCodeWorkspace: false,
          newVault: true,
        });
      } else {
        await wsService.createVault({ vault });
      }
      await this.addVaultToWorkspace(vault);
      vaults = [vault];
    }
    window.showInformationMessage("finished adding vault");
    await commands.executeCommand("workbench.action.reloadWindow");
    return { vaults };
  }
}
