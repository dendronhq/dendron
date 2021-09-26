import fs from "fs-extra";
import path from "path";
import { window } from "vscode";

import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";
import { convertLessFile } from "../utils/styles";
import { getExtension } from "../workspace";

enum Customization {
  Preview,
  Publishing,
}

type CommandOpts = { type: Customization };

type CommandOutput = void;

export class ApplyTheme extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.APPLY_THEME.key;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const themeType = await VSCodeUtils.showQuickPick([
      { label: "Preview", value: Customization.Preview },
      { label: "Publishing", value: Customization.Publishing },
    ]);
    if (themeType) return { type: themeType.value };
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

    if (type === Customization.Preview) {
      const LessFilePath = path.join(workspaceRoot, "style.less");

      const doesLessFileExist = await fs.pathExists(LessFilePath);

      if (doesLessFileExist) {
        const CSSFilePath = path.join(workspaceRoot, "build");

        await convertLessFile(LessFilePath, CSSFilePath);
        this.showInfo(path.join(CSSFilePath, "style.css"));
      } else {
        this.showError(LessFilePath);
      }
    } else if (type === Customization.Publishing) {
      const LessFilePath = path.join(workspaceRoot, ".next", "style.less");

      const doesLessFileExist = await fs.pathExists(LessFilePath);

      if (doesLessFileExist) {
        const CSSFilePath = path.join(workspaceRoot, ".next", "public");
        await convertLessFile(LessFilePath, CSSFilePath);
        this.showInfo(path.join(CSSFilePath, "style.css"));
      } else {
        this.showError(LessFilePath);
      }
    }
  }
}
