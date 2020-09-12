import {
  DendronConfig,
  LegacyDendronSiteConfig,
  DendronSiteConfig,
} from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import _ from "lodash";

const DENDRON_CONFIG_FILE = "dendron.yml";

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

export class DConfig {
  static configPath(wsRoot: string): string {
    return path.join(wsRoot, DENDRON_CONFIG_FILE);
  }

  static genDefaultConfig(): DendronConfig {
    return {
      site: {
        siteHierarchies: ["root"],
        siteRootDir: "docs",
        usePrettyRefs: true,
      },
    };
  }

  static getOrCreate(dendronRoot: string): DendronConfig {
    const configPath = DConfig.configPath(dendronRoot);
    let config: DendronConfig;
    if (!fs.existsSync(configPath)) {
      config = DConfig.genDefaultConfig();
      writeYAML(configPath, config);
    } else {
      config = readYAML(configPath) as DendronConfig;
      if (isLegacySiteConfig(config.site)) {
        config.site = rewriteSiteConfig(config.site as LegacyDendronSiteConfig);
        writeYAML(DConfig.configPath(dendronRoot), config);
      }
    }
    return config;
  }
}
