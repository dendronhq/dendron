import { DEngineClientV2 } from "@dendronhq/common-all";
import {
  BackfillV2Command,
  DoctorActions,
  DoctorCLICommand,
} from "@dendronhq/dendron-cli";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type Finding = {
  issue: string;
  fix?: string;
};
type CommandOpts = {
  action: DoctorActions;
};

type CommandOutput = {
  data: Finding[];
};

export class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.DOCTOR.key;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const values = _.map(DoctorActions, (ent) => {
      return { label: ent };
    });
    const doctorAction = await VSCodeUtils.showQuickPick(values);
    if (doctorAction?.label) {
      return { action: doctorAction.label };
    }
    return;
  }

  async execute(opts: CommandOpts) {
    const ctx = "DoctorCommand:execute";
    window.showInformationMessage("Calling the doctor.");
    const {} = _.defaults(opts, {});
    const ws = DendronWorkspace.instance();
    const wsRoot = DendronWorkspace.wsRoot();
    const findings: Finding[] = [];
    if (_.isUndefined(wsRoot)) {
      throw Error("rootDir undefined");
    }
    const config = ws?.config;
    if (_.isUndefined(config)) {
      throw Error("no config found");
    }

    const siteRoot = path.join(wsRoot, config.site.siteRootDir);
    ws.vaultWatcher!.pause = true;
    this.L.info({ ctx, msg: "pre:Reload" });
    const engine: DEngineClientV2 = (await new ReloadIndexCommand().execute()) as DEngineClientV2;

    switch (opts.action) {
      case DoctorActions.FIX_FRONTMATTER: {
        await new BackfillV2Command().execute({
          engine: engine,
        });
        break;
      }
      default: {
        const cmd = new DoctorCLICommand();
        await cmd.execute({
          action: opts.action,
          engine,
          wsRoot,
          server: {},
          exit: false,
        });
      }
    }

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
