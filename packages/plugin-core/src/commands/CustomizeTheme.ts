import fs from "fs-extra";
import path from "path";
import { Uri, window } from "vscode";

import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { getExtension } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  type: string;
};

type CommandOutput = void;

export class CustomizeTheme extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.CUSTOMIZE_THEME.key;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const themeType = await VSCodeUtils.showQuickPick([
      { label: "preview" },
      { label: "publishing" },
    ]);
    if (themeType) return { type: themeType.label };
    return undefined;
  }

  async showInfo(message: string) {
    window.showInformationMessage(message);
  }

  async showError(message: string) {
    window.showErrorMessage(message);
  }

  async execute({ type }: CommandOpts) {
    const workspaceRoot = getExtension().rootWorkspace.uri.fsPath;

    if (type === "preview") {
      const styleFilePath = path.join(workspaceRoot, "style.less");

      if (!fs.pathExistsSync(styleFilePath)) {
        fs.writeFile(styleFilePath, "");

        this.showInfo(`Generating custom style file at ${styleFilePath}`);
      } else {
        this.showInfo(`Opening existing custom style file at ${styleFilePath}`);
      }
      const uri = Uri.file(styleFilePath);
      VSCodeUtils.openFileInEditor(uri);
    } else if (type === "publishing") {
      const nextJSPublishPath = path.join(workspaceRoot, ".next");
      if (fs.pathExistsSync(nextJSPublishPath)) {
        const styleFilePath = path.join(nextJSPublishPath, "style.less");
        if (!fs.pathExistsSync(styleFilePath)) {
          fs.writeFile(styleFilePath, "");
          this.showInfo(`Generating custom style file at ${styleFilePath}`);
        } else {
          this.showInfo(
            `Opening existing custom style file at ${styleFilePath}`
          );
        }
        const uri = Uri.file(styleFilePath);
        VSCodeUtils.openFileInEditor(uri);
      } else {
        this.showError(`NextJS Publishing isn't initialized`);
      }
    }
  }
}
