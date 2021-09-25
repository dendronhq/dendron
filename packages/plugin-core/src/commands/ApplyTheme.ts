import fs from "fs-extra";
import path from "path";
import { window } from "vscode";

import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";
import { convertLessFile } from "../utils/styles";
import { getExtension } from "../workspace";

type CommandOpts = { type: string };

type CommandOutput = void;

export class ApplyTheme extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.APPLY_THEME.key;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const themeType = await VSCodeUtils.showQuickPick([
      { label: "preview" },
      { label: "publishing" },
    ]);
    if (themeType) return { type: themeType.label };
    return undefined;
  }

  async showInfo(styleFilePath: string) {
    window.showInformationMessage(
      `CSS file has been generated at ${styleFilePath}`
    );
  }

  async showError(styleFilePath: string) {
    window.showErrorMessage(
      `Could'nt locate ${styleFilePath}. Please execute "Customize theme" before calling "Applying theme".`
    );
  }

  async execute({ type }: CommandOpts) {
    const workspaceRoot = getExtension().rootWorkspace.uri.fsPath;

    if (type === "preview") {
      const styleFilePath = path.join(workspaceRoot, "style.less");

      if (fs.pathExistsSync(styleFilePath)) {
        await convertLessFile(styleFilePath, workspaceRoot);
        this.showInfo(path.join(workspaceRoot, "style.css"));
      } else {
        this.showError(styleFilePath);
      }
    } else if (type === "publishing") {
      const styleFilePath = path.join(workspaceRoot, ".next", "style.less");

      if (fs.pathExistsSync(styleFilePath)) {
        const convertedStyleFilePath = path.join(
          workspaceRoot,
          ".next",
          "public"
        );
        await convertLessFile(styleFilePath, convertedStyleFilePath);
        this.showInfo(path.join(convertedStyleFilePath, "style.css"));
      } else {
        this.showError(styleFilePath);
      }
    }
  }
}
