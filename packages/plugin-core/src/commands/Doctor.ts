import { BackfillCommand } from "@dendronhq/dendron-cli";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";
import {
  LegacyDendronSiteConfig,
  DendronSiteConfig,
} from "@dendronhq/common-all";
import { writeYAML } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";

type Finding = {
  issue: string;
  fix?: string;
};
type CommandOpts = {};

type CommandOutput = {
  data: Finding[];
};

function isLegacySiteConfig(site: any): boolean {
  return !_.isEmpty(
    _.intersection(_.keys(site), ["noteRoot", "noteRoots", "siteRoot"])
  );
}

function rewriteSiteConfig(site: LegacyDendronSiteConfig): DendronSiteConfig {
  const remap = {
    noteRoot: "siteIndex",
    noteRoots: "siteHierarchies",
    siteRoot: "siteRootDir",
  };
  _.each(remap, (v, k) => {
    if (_.has(site, k)) {
      // @ts-ignore
      site[v] = site[k];
      // @ts-ignore
      delete site[k];
    }
  });

  return site as DendronSiteConfig;
}

export class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async execute(opts: CommandOpts) {
    const {} = _.defaults(opts, {});
    const ctx = "DoctorCommand";
    const ws = DendronWorkspace.instance();
    const rootDir = DendronWorkspace.rootDir();
    const findings: Finding[] = [];
    if (_.isUndefined(rootDir)) {
      throw Error("rootDir undefined");
    }

    const config = ws?.config;
    if (_.isUndefined(config)) {
      throw Error("no config found");
    }

    // check if config needs to be updated
    const { site } = config;
    if (isLegacySiteConfig(site)) {
      this.L.info({ ctx, msg: "found legacy site config, updating", site });
      config.site = rewriteSiteConfig(site as LegacyDendronSiteConfig);
      writeYAML(DConfig.configPath(rootDir), config);
    }

    const siteRoot = path.join(rootDir, config.site.siteRootDir);
    const engine = await new ReloadIndexCommand().execute();
    await new BackfillCommand().execute({ engine });

    // create site root, used for publication
    if (!fs.existsSync(siteRoot)) {
      const f: Finding = { issue: "no siteRoot found" };
      const dendronWSTemplate = Uri.joinPath(ws.extensionAssetsDir, "dendronWS")
        .fsPath;
      const dendronSiteRoot = path.join(dendronWSTemplate, "docs");
      fs.copySync(dendronSiteRoot, siteRoot);
      f.fix = `created siteRoot at ${siteRoot}`;
      findings.push(f);
    }
    return { data: findings };
    // check for docs folrder
  }
  async showResponse(findings: CommandOutput) {
    findings.data.forEach((f) => {
      window.showInformationMessage(`issue: ${f.issue}. fix: ${f.fix}`);
    });
    window.showInformationMessage(`doctor finished checkup`);
  }
}
