import { CONSTANTS, DVault } from "@dendronhq/common-all";
import { resolveTilde } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BlankInitializer } from "../workspace/blankInitializer";
import { TemplateInitializer } from "../workspace/templateInitializer";
import { TutorialInitializer } from "../workspace/tutorialInitializer";
import { WorkspaceInitializer } from "../workspace/workspaceInitializer";
import { BasicCommand } from "./base";

type CommandOpts = {
  rootDirRaw: string;
  vault?: DVault;
  skipOpenWs?: boolean;
  /**
   * override prompts
   */
  skipConfirmation?: boolean;
  workspaceInitializer?: WorkspaceInitializer;
};

type CommandInput = {
  rootDirRaw: string;
  workspaceInitializer?: WorkspaceInitializer;
};

type CommandOutput = DVault[];

export { CommandOpts as SetupWorkspaceOpts };

export class SetupWorkspaceCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.INIT_WS.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const rootDirRaw = await VSCodeUtils.gatherFolderPath({
      default: path.join(resolveTilde("~"), "Dendron"),
    });
    if (_.isUndefined(rootDirRaw)) {
      return;
    }

    const vaultType = await VSCodeUtils.showQuickPick([
      {
        label: "default",
        picked: true,
        detail: "An empty vault with a template gallery.",
      },
      {
        label: "blank",
        detail: "A completely empty workspace.",
      },
      { label: "tutorial", detail: "Contains the Dendron tutorial notes." },
    ]);

    if (!vaultType) {
      return;
    }
    switch (vaultType.label) {
      case "default":
        return { rootDirRaw, workspaceInitializer: new TemplateInitializer() };
      case "blank":
        return { rootDirRaw, workspaceInitializer: new BlankInitializer() };
      case "tutorial":
        return { rootDirRaw, workspaceInitializer: new TutorialInitializer() };
      default:
        return { rootDirRaw };
    }
  }

  handleExistingRoot = async ({
    rootDir,
    skipConfirmation,
  }: {
    rootDir: string;
    skipConfirmation?: boolean;
  }): Promise<boolean> => {
    if (fs.existsSync(rootDir) && !skipConfirmation) {
      const options = {
        delete: { msg: "delete existing folder", alias: "d" },
        abort: { msg: "abort current operation", alias: "a" },
        continue: {
          msg: "initialize workspace into current folder",
          alias: "c",
        },
      };
      const resp = await vscode.window.showInputBox({
        prompt: `${rootDir} exists. Please specify the next action. Your options: ${_.map(
          options,
          (v, k) => {
            return `(${k}: ${v.msg})`;
          }
        ).join(", ")}`,
        ignoreFocusOut: true,
        value: "continue",
        validateInput: async (value: string) => {
          if (!_.includes(_.keys(options), value.toLowerCase())) {
            return `not valid input. valid inputs: ${_.keys(options).join(
              ", "
            )}`;
          }
          return null;
        },
      });

      if (resp === "abort") {
        vscode.window.showInformationMessage(
          "did not initialize dendron workspace"
        );
        return false;
      } else if (resp === "delete") {
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

  async execute(opts: CommandOpts): Promise<DVault[]> {
    const ctx = "SetupWorkspaceCommand extends BaseCommand";
    const ws = DendronWorkspace.instance();
    const { rootDirRaw: rootDir, skipOpenWs } = _.defaults(opts, {
      skipOpenWs: false,
    });
    ws.L.info({ ctx, rootDir, skipOpenWs });

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

    await WorkspaceService.createWorkspace({
      vaults,
      wsRoot: rootDir,
      createCodeWorkspace: true,
    }).then(async (ws) => {
      if (opts?.workspaceInitializer?.onWorkspaceCreation) {
        await opts.workspaceInitializer.onWorkspaceCreation({
          vaults,
          wsRoot: rootDir,
          svc: ws,
        });
      }
    });

    if (!opts.skipOpenWs) {
      vscode.window.showInformationMessage("opening dendron workspace");
      VSCodeUtils.openWS(
        vscode.Uri.file(path.join(rootDir, CONSTANTS.DENDRON_WS_NAME)).fsPath
      );
    }
    return vaults;
  }
}
