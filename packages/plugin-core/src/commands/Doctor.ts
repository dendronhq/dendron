import { DEngineClientV2 } from "@dendronhq/common-all";
import { BackfillV2Command } from "@dendronhq/dendron-cli";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type Finding = {
  issue: string;
  fix?: string;
};
type CommandOpts = {};

type CommandOutput = {
  data: Finding[];
};

export class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.DOCTOR.key;
  async execute(opts: CommandOpts) {
    const ctx = "DoctorCommand:execute";
    window.showInformationMessage("Calling the doctor.");
    const {} = _.defaults(opts, {});
    const ws = DendronWorkspace.instance();
    const rootDir = DendronWorkspace.wsRoot();
    const findings: Finding[] = [];
    if (_.isUndefined(rootDir)) {
      throw Error("rootDir undefined");
    }

    const config = ws?.config;
    if (_.isUndefined(config)) {
      throw Error("no config found");
    }

    const siteRoot = path.join(rootDir, config.site.siteRootDir);
    getWS().vaultWatcher!.pause = true;
    this.L.info({ ctx, msg: "pre:Reload" });
    // TODO
    const engine = await new ReloadIndexCommand().execute();
    await new BackfillV2Command().execute({
      engine: engine as DEngineClientV2,
    });
    getWS().vaultWatcher!.pause = false;
    await new ReloadIndexCommand().execute();

    // create site root, used for publication
    if (!fs.existsSync(siteRoot)) {
      const f: Finding = { issue: "no siteRoot found" };
      const dendronJekyll = Uri.joinPath(ws.extensionAssetsDir, "jekyll");
      fs.copySync(dendronJekyll.fsPath, siteRoot);
      f.fix = `created siteRoot at ${siteRoot}`;
      findings.push(f);
    }
    return { data: findings };
  }
  async showResponse(findings: CommandOutput) {
    findings.data.forEach((f) => {
      window.showInformationMessage(`issue: ${f.issue}. fix: ${f.fix}`);
    });
    window.showInformationMessage(`Doctor finished checkup 🍭`);
  }
}
