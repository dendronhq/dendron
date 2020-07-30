import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type Finding = {
  issue: string;
  fix?: string;
};
type CommandOpts = {};

type CommandInput = {};

type CommandOutput = {
    data: Finding[]
};

export class DoctorCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  async gatherInputs(): Promise<CommandInput | undefined> {
    const resp = await window.showInputBox({
      prompt: "Select your folder for dendron",
      ignoreFocusOut: true,
      validateInput: (input: string) => {
        if (!path.isAbsolute(input)) {
          if (input[0] !== "~") {
            return "must enter absolute path";
          }
        }
        return undefined;
      },
    });
    if (_.isUndefined(resp)) {
      return;
    }
    return;
  }

  async execute(opts: CommandOpts) {
    const {} = _.defaults(opts, {});
    const ws = DendronWorkspace.instance();
    const rootDir = DendronWorkspace.rootDir();
    const findings: Finding[] = [];
    if (_.isUndefined(rootDir)) {
      throw Error("rootDir undefined");
    }
    const siteRoot = path.join(rootDir, ws.config.site.siteRoot);
    if (!fs.existsSync(siteRoot)) {
    const f: Finding = { issue: "no siteRoot found" };
      const dendronWSTemplate = Uri.joinPath(ws.extensionAssetsDir, "dendronWS").fsPath;
      const dendronSiteRoot = path.join(dendronWSTemplate, "docs");
      fs.copySync(dendronSiteRoot, siteRoot);
      f.fix = `created siteRoot at ${siteRoot}`
      findings.push(f);
    }
    return {data: findings}
    // check for docs folrder
  }
}
