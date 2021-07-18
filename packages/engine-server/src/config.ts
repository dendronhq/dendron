import {
  CleanDendronSiteConfig,
  CONSTANTS,
  DendronConfig,
  DendronError,
  DendronSiteConfig,
  ERROR_STATUS,
  getStage,
  NoteAddBehavior,
} from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export class ConfigUtils {
  static usePrettyRef(config: DendronConfig) {
    let usePrettyRefs: boolean | undefined = _.find(
      [config?.usePrettyRefs, config?.site?.usePrettyRefs],
      (ent) => !_.isUndefined(ent)
    );
    if (_.isUndefined(usePrettyRefs)) {
      usePrettyRefs = true;
    }
    return usePrettyRefs;
  }
}

export class DConfig {
  static configPath(configRoot: string): string {
    return path.join(configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  static defaults(config: DendronConfig): DendronConfig {
    return _.defaults(config, { initializeRemoteVaults: true });
  }

  static genDefaultConfig(): DendronConfig {
    return {
      version: 1,
      vaults: [],
      useFMTitle: true,
      useNoteTitleForLink: true,
      noAutoCreateOnDefinition: true,
      noLegacyNoteRef: true,
      noXVaultWikiLink: true,
      lookupConfirmVaultOnCreate: false,
      mermaid: true,
      useKatex: true,
      autoFoldFrontmatter: true,
      journal: {
        dailyDomain: "daily",
        name: "journal",
        dateFormat: "y.MM.dd",
        addBehavior: NoteAddBehavior.childOfDomain,
        firstDayOfWeek: 1,
      },
      site: {
        copyAssets: true,
        siteHierarchies: ["root"],
        siteRootDir: "docs",
        usePrettyRefs: true,
        title: "Dendron",
        description: "Personal knowledge space",
      },
    };
  }

  /**
   * Get without filling in defaults
   * @param wsRoot
   */
  static getRaw(wsRoot: string) {
    const configPath = DConfig.configPath(wsRoot);
    const config = readYAML(configPath) as Partial<DendronConfig>;
    return config;
  }

  static getOrCreate(
    dendronRoot: string,
    defaults?: Partial<DendronConfig>
  ): DendronConfig {
    const configPath = DConfig.configPath(dendronRoot);
    let config: DendronConfig;
    if (!fs.existsSync(configPath)) {
      config = { ...defaults, ...DConfig.genDefaultConfig() };
      writeYAML(configPath, config);
    } else {
      config = readYAML(configPath) as DendronConfig;
    }
    return config;
  }

  /**
   * Get config value with consideration for defaults
   * @param config
   */
  static getProp<K extends keyof DendronConfig>(
    config: DendronConfig,
    key: K
  ): DendronConfig[K] {
    const cConfig = _.defaults(
      config,
      this.genDefaultConfig()
    ) as Required<DendronConfig>;
    return cConfig[key];
  }

  static getSiteIndex(sconfig: DendronSiteConfig) {
    let { siteIndex, siteHierarchies } = sconfig;
    return siteIndex || siteHierarchies[0];
  }

  /**
   * fill in defaults
   */
  static cleanSiteConfig(config: DendronSiteConfig): CleanDendronSiteConfig {
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
      description: "Personal knowledge space",
    });
    let { siteRootDir, siteHierarchies, siteIndex, siteUrl } = out;
    if (process.env["SITE_URL"]) {
      siteUrl = process.env["SITE_URL"];
    }
    if (!siteRootDir) {
      throw `siteRootDir is undefined`;
    }
    if (!siteUrl && getStage() === "dev") {
      // this gets overridden in dev so doesn't matter
      siteUrl = "https://foo";
    }
    if (!siteUrl) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_CONFIG,
        message:
          "siteUrl is undefined. See https://dendron.so/notes/f2ed8639-a604-4a9d-b76c-41e205fb8713.html#siteurl for more details",
      });
    }
    if (_.size(siteHierarchies) < 1) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_CONFIG,
        message: `siteHiearchies must have at least one hiearchy`,
      });
    }
    siteIndex = this.getSiteIndex(config);
    return {
      ...out,
      siteIndex,
      siteUrl,
    };
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
