import {
  asyncDoWhileLoop,
  CONSTANTS,
  DendronError,
  DVault,
  DWorkspace,
  FIFOQueue,
  FOLDERS,
  RespV3,
  SEED_REGISTRY,
  VaultRemoteSource,
  VaultUtils,
} from "@dendronhq/common-all";
import { GitUtils, simpleGit } from "@dendronhq/common-server";
import {
  DConfig,
  Git,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { commands, ProgressLocation, QuickPickItem, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS, DENDRON_REMOTE_VAULTS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
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

type VaultCloneTarget = {
  /** Name that the cloned vault should have, if any. */
  name?: string;
  /** The local path the clone into. Should be an absolute path. */
  localUrl: string;
  /** The git remote URL to clone from. */
  remoteUrl: string;
  /** The root of the workspace that will include this vault. */
  wsRoot: string;
};

export class VaultAddCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.VAULT_ADD.key;

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
    sourceType: VaultRemoteSource
  ): Promise<CommandOpts | undefined> {
    const localVaultPathPlaceholder = "vault2";
    let sourcePath: string;
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

          const out = await VSCodeUtils.showInputBox({
            prompt: "Path to your new vault (relative to your workspace root)",
            placeHolder: localVaultPathPlaceholder,
            value: path2Vault,
          });
          if (PickerUtilsV2.isInputEmpty(out)) {
            resolve(undefined);
          }
          sourcePath = out!;

          sourceName = await VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
            value: placeHolder,
          });
          qp.hide();
          return resolve({
            type: sourceType!,
            name: sourceName,
            path: sourcePath,
            pathRemote: sourceRemotePath,
          });
        });
        qp.show();
      });
      return out;
    } else {
      const out = await VSCodeUtils.showInputBox({
        prompt: "Path to your new vault (relative to your workspace root)",
        placeHolder: localVaultPathPlaceholder,
      });
      if (PickerUtilsV2.isInputEmpty(out)) return;
      sourcePath = out!;
    }
    sourceName = await VSCodeUtils.showInputBox({
      prompt: "Name of new vault (optional, press enter to skip)",
    });
    return {
      type: sourceType,
      name: sourceName,
      path: sourcePath,
    };
  }

  async gatherVaultSelfContained(
    sourceType: VaultRemoteSource
  ): Promise<CommandOpts | undefined> {
    // If the vault name already exists, creating a vault with the same name would break things

    if (sourceType === VaultType.LOCAL) {
      // Local vault
      // For self contained vaults, we'll have the vault name match the folder for
      // now. We can make this flexible later if that's a better UX, or give
      // instructions on the wiki on how to change the name later.
      const vaultName = await VSCodeUtils.showInputBox({
        title: "Vault name",
        prompt: "Name for the new vault",
        placeHolder: "my-vault",
      });
      // If empty, then user cancelled the prompt
      if (PickerUtilsV2.isInputEmpty(vaultName)) return;

      return {
        type: sourceType,
        name: vaultName,
        path: path.join(
          FOLDERS.DEPENDENCIES,
          FOLDERS.LOCAL_DEPENDENCY,
          vaultName
        ),
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

      // Calculate the vault name from the remote. If that fails, ask the user for a unique name to use.
      const vaultName: string | undefined = GitUtils.getRepoNameFromURL(remote);

      return {
        type: sourceType,
        name: vaultName,
        path: path.join(
          FOLDERS.DEPENDENCIES,
          GitUtils.remoteUrlToDependencyPath({
            vaultName,
            url: remote,
          })
        ),
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

    const { config } = ExtensionProvider.getDWorkspace();
    if (config.dev?.enableSelfContainedVaults) {
      return this.gatherVaultSelfContained(sourceType);
    } else {
      // A "standard", non self contained vault
      return this.gatherVaultStandard(sourceType);
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
        const baseDir = ExtensionProvider.getDWorkspace().wsRoot;
        const git = simpleGit({ baseDir });
        await git.clone(opts.pathRemote!, opts.path);
        const { vaults, workspace } = await GitUtils.getVaultsFromRepo({
          repoPath: path.join(baseDir, opts.path),
          wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
          repoUrl: opts.pathRemote!,
        });
        if (_.size(vaults) === 1 && opts.name) {
          vaults[0].name = opts.name;
        }
        // add all vaults
        progress.report({
          message: "adding vault",
        });
        const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
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

  /** Clones a remote to a local location, and extracts the vault */
  async cloneAndExtractVault({
    name,
    remoteUrl,
    localUrl,
    wsRoot,
  }: VaultCloneTarget): Promise<RespV3<DVault>> {
    if (await fs.pathExists(localUrl)) {
      return {
        error: new DendronError({
          message: `Cloning ${remoteUrl} to ${localUrl} would write over existing data`,
          payload: {
            remoteUrl,
            localUrl,
            name,
          },
        }),
      };
    }

    await fs.ensureDir(localUrl);
    const git = new Git({ localUrl, remoteUrl });
    // `.` so it clones into the `localUrl` directory, not into a subdirectory of that
    await git.clone(".");
    const vault: DVault = {
      fsPath: path.relative(wsRoot, localUrl),
      remote: {
        type: "git",
        url: remoteUrl,
      },
    };
    if (name) vault.name = name;
    // If it has a config file, it's a self contained vault. It also could be a
    // workspace vault, but those are just self contained vaults without a notes
    // folder.
    if (await fs.pathExists(path.join(localUrl, CONSTANTS.DENDRON_CONFIG_FILE)))
      vault.selfContained = true;
    return {
      data: vault,
    };
  }

  /** Get the dependencies of this vault.
   *
   * If `localUrl` points to the directory of a self contained vault (or a
   * workspace vault), then gets the dependencies for that self contained vault.
   * If it's an old style vault, then this will just return an empty list.
   */
  async getVaultDependencies({
    wsRoot,
    vault,
  }: {
    wsRoot: string;
    vault: DVault;
  }): Promise<DVault[]> {
    const localUrl = path.join(wsRoot, vault.fsPath);
    try {
      const config = await DConfig.getRaw(localUrl);
      return (config?.vaults ?? [])
        .filter(
          // Skip ...
          (vault) =>
            // ... the self entry of self-contained vaults
            vault.fsPath !== "." &&
            // ... vaults inside seeds, because the seed itself is a vault now
            vault.seed === undefined &&
            // ... vaults inside workspaces, because the workspace itself is a vault now
            vault.workspace === undefined
        )
        .concat(
          // Convert workspaces to self contained vault entries
          Object.entries(config?.workspaces ?? {})?.map(
            ([workspaceName, workspace]): DVault => {
              return {
                fsPath: path.join(wsRoot, workspaceName),
                name: workspaceName,
                remote: workspace?.remote,
                selfContained: true,
              };
            }
          ),
          // Convert seeds to self contained vault entries
          Object.entries(config?.seeds ?? {})?.map(
            ([seedName, seed]): DVault => {
              const seedRegistry = SEED_REGISTRY[seedName];
              const vault: DVault = {
                fsPath: path.join(wsRoot, "seeds", seedName),
                name: seedName,
                selfContained: true,
              };
              if (seedRegistry?.repository) {
                vault.remote = {
                  type: seedRegistry?.repository.type,
                  url: seedRegistry?.repository.url,
                };
              }
              if (seed?.site) {
                vault.publish = {
                  index: seed.site.index,
                  url: seed.site.url,
                };
              }
              return vault;
            }
          )
        );
    } catch (error: any) {
      // If the config doesn't exist, ignore the error
      if (error?.code !== "ENOENT") throw error;
    }
    return [];
  }

  async handleRemoteRepoSelfContained(
    opts: CommandOpts
  ): Promise<{ vaults: DVault[] }> {
    const { name, pathRemote: remoteUrl } = opts;
    if (!remoteUrl) {
      throw new DendronError({
        message:
          "Remote vault has no remote set. This should never happen, please send a bug report if you encounter this.",
      });
    }
    const { wsRoot } = ExtensionProvider.getDWorkspace();

    return window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Adding remote vault",
        cancellable: false,
      },
      async (progress) => {
        progress.report({
          message: "cloning repo",
          increment: 0,
        });

        const localUrl = path.join(wsRoot, opts.path);
        // The queue of vaults to be cloned. We may need to do more than 1 clone
        // if there are transitive dependencies.
        const cloneQueue = new FIFOQueue<VaultCloneTarget>([
          // Initialize with the selected vault
          {
            wsRoot,
            remoteUrl,
            localUrl,
            name,
          },
        ]);

        const vaults: DVault[] = [];
        await asyncDoWhileLoop(async () => {
          const next = cloneQueue.dequeue();
          if (next === undefined) return false;
          const { data: vault, error } = await this.cloneAndExtractVault(next);
          // Vault already exists, may mean a circular vault dependency. Skip it.
          if (error || !vault) return true;
          // Otherwise we successfully cloned the vault
          vaults.push(vault);

          const dependencies = await this.getVaultDependencies({
            wsRoot,
            vault,
          });
          cloneQueue.enqueueAll(
            // If the cloned vault has any remote dependencies, we'll need to clone them too
            dependencies.filter(VaultUtils.isRemote).map((vault) => {
              return {
                wsRoot,
                localUrl: "",
                remoteUrl: vault.remote.url,
                name: vault.name,
              };
            })
          );

          return true;
        });

        const wsService = new WorkspaceService({ wsRoot });

        for (const vault of vaults) {
          if (VaultUtils.isSelfContained(vault)) {
            // eslint-disable-next-line no-await-in-loop
            await wsService.createSelfContainedVault({
              vault,
              addToConfig: true,
              addToCodeWorkspace: false,
            });
          } else {
            // eslint-disable-next-line no-await-in-loop
            await wsService.createVault({ vault });
          }
          // eslint-disable-next-line no-await-in-loop
          await this.addVaultToWorkspace(vault);
        }

        wsService.dispose();
        return { vaults };
      }
    );
  }

  async addWorkspaceToWorkspace(workspace: DWorkspace) {
    const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
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
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "VaultAdd";
    let vaults: DVault[] = [];
    Logger.info({ ctx, msg: "enter", opts });
    if (opts.type === VaultType.REMOTE) {
      if (opts.isSelfContained) {
        ({ vaults } = await this.handleRemoteRepoSelfContained(opts));
      } else {
        ({ vaults } = await this.handleRemoteRepo(opts));
      }
    } else {
      const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
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
