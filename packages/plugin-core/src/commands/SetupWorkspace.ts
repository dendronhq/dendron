import { CONSTANTS, DVault, WorkspaceType } from "@dendronhq/common-all";
import { resolveTilde } from "@dendronhq/common-server";
import { WorkspaceService, WorkspaceUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import PathLike = fs.PathLike;
import _ from "lodash";
import path from "path";
import vscode, { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { BlankInitializer } from "../workspace/blankInitializer";
import { WorkspaceInitializer } from "../workspace/workspaceInitializer";
import { BasicCommand } from "./base";

type CommandInput = {
  rootDirRaw: string;
  workspaceInitializer?: WorkspaceInitializer;
  workspaceType?: WorkspaceType;
};

type CommandOpts = CommandInput & {
  vault?: DVault;
  skipOpenWs?: boolean;
  /**
   * override prompts
   */
  skipConfirmation?: boolean;
};

type CommandOutput = DVault[];

export { CommandOpts as SetupWorkspaceOpts };

const CODE_WS_LABEL = "Code Workspace";
const CODE_WS_DETAIL = undefined;

enum EXISTING_ROOT_ACTIONS {
  CONTINUE = "Continue",
  DELETE = "Delete",
  ABORT = "Abort",
}

export class SetupWorkspaceCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.INIT_WS.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    let workspaceType = WorkspaceType.CODE;
    //const defaultUri = Uri.file(resolveTilde("~"));
    let rootDirRaw: string | undefined;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (
      workspaceFolders !== undefined &&
      workspaceFolders.length > 0 &&
      (await WorkspaceUtils.getWorkspaceType({
        workspaceFolders,
      })) === WorkspaceType.NONE
    ) {
      // If there's a non-Dendron workspace already open, offer to convert that to a Dendron workspace first
      const initNative = await VSCodeUtils.showQuickPick(
        [
          {
            picked: true,
            label: CODE_WS_LABEL,
            description: CODE_WS_DETAIL,
            detail: "A dedicated IDE workspace for just your notes",
          },
          ...workspaceFolders.map((folder) => {
            const folderName = folder.name || folder.uri.fsPath;
            return {
              label: "Native Workspace",
              description: folder.uri.fsPath,
              detail: `Take notes in "${folderName}" alongside your existing project`,
            };
          }),
        ],
        {
          ignoreFocusOut: true,
          title: "Workspace type to initialize",
        }
      );
      if (initNative === undefined) return;
      if (
        initNative.label !== CODE_WS_LABEL ||
        initNative.description !== CODE_WS_DETAIL
      ) {
        // Not sure if there's a better way to check for this, but this is if a native workspace option was selected
        workspaceType = WorkspaceType.NATIVE;
        rootDirRaw = await VSCodeUtils.gatherFolderPath({
          default: "docs",
          relativeTo: initNative.description,
          override: {
            title: "Path for Dendron Native Workspace",
            prompt: `Path to folder, relative to ${initNative.label}`,
          },
        });
      }
      // If the code workspace option is selected, then we continue with `rootDirRaw` unset and type still set to `CODE`
    }

    if (!rootDirRaw) {
      // Prompt user where to create workspace
      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: "Create Workspace",
        canSelectFiles: false,
        canSelectFolders: true,
        //defaultUri,
      };
      rootDirRaw = await VSCodeUtils.openFilePicker(options);
      if (_.isUndefined(rootDirRaw)) {
        return;
      }
    }

    return {
      rootDirRaw,
      workspaceType,
      workspaceInitializer: new BlankInitializer(),
    };
  }

  handleExistingRoot = async ({
    rootDir,
    skipConfirmation,
  }: {
    rootDir: string;
    skipConfirmation?: boolean;
  }): Promise<boolean> => {
    if (!this.isEmptyDirectory(rootDir) && !skipConfirmation) {
      const resp = await VSCodeUtils.showQuickPick(
        [
          {
            label: EXISTING_ROOT_ACTIONS.CONTINUE,
            detail: `Continue creating a workspace, putting Dendron files into the existing folder.`,
          },
          {
            label: EXISTING_ROOT_ACTIONS.DELETE,
            detail: "Delete this folder and continue creating a workspace.",
          },
          {
            label: EXISTING_ROOT_ACTIONS.ABORT,
            detail: "Abort creating a workspace.",
          },
        ],
        {
          title: `${rootDir} already exists, how do you want to continue?`,
          ignoreFocusOut: true,
          canPickMany: false,
        }
      );

      if (resp === undefined || resp.label === EXISTING_ROOT_ACTIONS.ABORT) {
        vscode.window.showInformationMessage(
          "did not initialize dendron workspace"
        );
        return false;
      }
      if (resp.label === EXISTING_ROOT_ACTIONS.DELETE) {
        try {
          fs.removeSync(rootDir);
          return true;
        } catch (err) {
          this.L.error(JSON.stringify(err));
          vscode.window.showErrorMessage(
            `error removing ${rootDir}. please check that it's not currently open`
          );
          return false;
        }
      }
      return true;
    }
    return true;
  };

  addAnalyticsPayload(opts?: CommandOpts) {
    return {
      workspaceType: opts?.workspaceType,
    };
  }

  async execute(opts: CommandOpts): Promise<DVault[]> {
    const ctx = "SetupWorkspaceCommand extends BaseCommand";
    const {
      rootDirRaw: rootDir,
      skipOpenWs,
      workspaceType,
    } = _.defaults(opts, {});
    Logger.info({ ctx, rootDir, skipOpenWs, workspaceType });

    if (
      !(await this.handleExistingRoot({
        rootDir,
        skipConfirmation: opts.skipConfirmation,
      }))
    ) {
      return [];
    }

    const vaults = opts.workspaceInitializer
      ? opts.workspaceInitializer.createVaults(opts.vault)
      : [];

    // Default to CODE workspace, otherwise create a NATIVE one
    const createCodeWorkspace =
      workspaceType === WorkspaceType.CODE || workspaceType === undefined;
    const svc = await WorkspaceService.createWorkspace({
      vaults,
      wsRoot: rootDir,
      createCodeWorkspace,
    });
    if (opts?.workspaceInitializer?.onWorkspaceCreation) {
      await opts.workspaceInitializer.onWorkspaceCreation({
        vaults,
        wsRoot: rootDir,
        svc,
      });
    }

    if (!skipOpenWs) {
      vscode.window.showInformationMessage("opening dendron workspace");
      if (workspaceType === WorkspaceType.CODE) {
        VSCodeUtils.openWS(
          vscode.Uri.file(path.join(rootDir, CONSTANTS.DENDRON_WS_NAME)).fsPath
        );
      } else if (workspaceType === WorkspaceType.NATIVE) {
        // For native workspaces, we just need to reload the existing workspace because we want to keep the same workspace.
        VSCodeUtils.reloadWindow();
      }
    }
    return vaults;
  }

  /**
   * Tests whether or not the given directory is empty.
   */
  private isEmptyDirectory(path: PathLike) {
    if (!fs.existsSync(path)) return true;

    const files = fs.readdirSync(path);
    return !files || !files.length;
  }
}
