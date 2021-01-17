import {
  CONSTANTS,
  DendronConfig,
  DendronSiteConfig,
} from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export class DConfig {
  static configPath(configRoot: string): string {
    return path.join(configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  static genDefaultConfig(): DendronConfig {
    return {
      version: 1,
      vaults: [],
      useFMTitle: true,
      site: {
        copyAssets: true,
        siteHierarchies: ["root"],
        siteRootDir: "docs",
        usePrettyRefs: true,
        title: "Dendron",
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
    }
    return config;
  }

  /**
   * fill in defaults
   */
  static cleanSiteConfig(config: DendronSiteConfig): DendronSiteConfig {
    let out: DendronSiteConfig = _.defaults(config, {
      copyAssets: true,
      usePrettyRefs: true,
      siteNotesDir: "notes",
      siteFaviconPath: "favicon.ico",
      gh_edit_link: true,
      gh_edit_link_text: "Edit this page on GitHub",
      gh_edit_branch: "master",
      gh_root: "docs/",
      gh_edit_view_mode: "edit",
      writeStubs: true,
    });
    let { siteRootDir, siteHierarchies, siteIndex } = out;
    if (!siteRootDir) {
      throw `siteRootDir is undefined`;
    }
    if (_.size(siteHierarchies) < 1) {
      throw `siteHiearchies must have at least one hiearchy`;
    }
    out.siteIndex = siteIndex || siteHierarchies[0];
    return out;
  }

  static writeConfig({
    wsRoot,
    config,
  }: {
    wsRoot: string;
    config: DendronConfig;
  }) {
    const configPath = DConfig.configPath(wsRoot);
    return writeYAML(configPath, config);
  }
}
