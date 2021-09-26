import fs from "fs-extra";
import path from "path";
import { Uri, window } from "vscode";

import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { getExtension } from "../workspace";
import { BasicCommand } from "./base";

enum Customization {
  Preview,
  Publishing,
}

type CommandOpts = {
  type: Customization;
};

type CommandOutput = void;

export class CustomizeTheme extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.CUSTOMIZE_THEME.key;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const themeType = await VSCodeUtils.showQuickPick([
      { label: "Preview", value: Customization.Preview },
      { label: "Publishing", value: Customization.Publishing },
    ]);
    if (themeType) return { type: themeType.value };
    return undefined;
  }

  showInfo(message: string) {
    window.showInformationMessage(message);
  }

  showError(message: string) {
    window.showErrorMessage(message);
  }

  onFileGenerated(styleFilePath: string) {
    this.showInfo(`Creating custom style file at ${styleFilePath}`);
  }

  onFileOpened(styleFilePath: string) {
    this.showInfo(`Opening existing custom style file at ${styleFilePath}`);
  }

  async execute({ type }: CommandOpts) {
    const workspaceRoot = getExtension().rootWorkspace.uri.fsPath;

    if (type === Customization.Preview) {
      const styleFilePath = path.join(workspaceRoot, "style.less");

      const isStyleFileCrated = await fs.pathExists(styleFilePath);

      if (!isStyleFileCrated) {
        fs.writeFile(styleFilePath, "");

        this.onFileGenerated(styleFilePath);
      } else {
        this.onFileOpened(styleFilePath);
      }
      const uri = Uri.file(styleFilePath);
      VSCodeUtils.openFileInEditor(uri);
    } else if (type === Customization.Publishing) {
      const nextJSPublishPath = path.join(workspaceRoot, ".next");

      const isPublishingInitialized = await fs.pathExists(nextJSPublishPath);

      if (isPublishingInitialized) {
        const styleFilePath = path.join(nextJSPublishPath, "style.less");

        const isStyleFileCrated = await fs.pathExists(styleFilePath);

        if (!isStyleFileCrated) {
          fs.writeFile(styleFilePath, "");
          this.onFileGenerated(styleFilePath);
        } else {
          this.onFileOpened(styleFilePath);
        }
        // open the generated file
        const uri = Uri.file(styleFilePath);
        VSCodeUtils.openFileInEditor(uri);
      } else {
        this.showError(`NextJS Publishing isn't initialized`);
      }
    }
  }
}
