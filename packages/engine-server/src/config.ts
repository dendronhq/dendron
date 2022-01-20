import {
  CleanDendronSiteConfig,
  CONSTANTS,
  IntermediateDendronConfig,
  DendronError,
  DendronSiteConfig,
  ERROR_STATUS,
  getStage,
  Time,
  ConfigUtils,
  DendronPublishingConfig,
  GithubEditViewModeEnum,
  CleanDendronPublishingConfig,
  configIsV4,
} from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export class DConfig {
  static configPath(configRoot: string): string {
    return path.join(configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  /**
   * Get without filling in defaults
   * @param wsRoot
   */
  static getRaw(wsRoot: string) {
    const configPath = DConfig.configPath(wsRoot);
    const config = readYAML(configPath) as Partial<IntermediateDendronConfig>;
    return config;
  }

  static getOrCreate(
    dendronRoot: string,
    defaults?: Partial<IntermediateDendronConfig>
  ): IntermediateDendronConfig {
    const configPath = DConfig.configPath(dendronRoot);
    let config: IntermediateDendronConfig = {
      ...defaults,
      ...ConfigUtils.genDefaultConfig(),
    };
    if (!fs.existsSync(configPath)) {
      writeYAML(configPath, config);
    } else {
      config = {
        ...config,
        ...readYAML(configPath),
      } as IntermediateDendronConfig;
    }
    return config;
  }

  static getSiteIndex(sconfig: DendronSiteConfig | DendronPublishingConfig) {
    const { siteIndex, siteHierarchies } = sconfig;
    return siteIndex || siteHierarchies[0];
  }

  /**
   * fill in defaults
   */
  static cleanSiteConfig(
    config: IntermediateDendronConfig
  ): CleanDendronSiteConfig | CleanDendronPublishingConfig {
    let out: DendronSiteConfig | DendronPublishingConfig;
    if (configIsV4(config)) {
      const siteConfig = ConfigUtils.getSite(config);
      out = _.defaults(siteConfig, {
        copyAssets: true,
        usePrettyRefs: true,
        siteNotesDir: "notes",
        siteFaviconPath: "favicon.ico",
        gh_edit_link: true,
        gh_edit_link_text: "Edit this page on GitHub",
        gh_edit_branch: "main",
        gh_root: "docs/",
        gh_edit_view_mode: "edit",
        writeStubs: true,
        description: "Personal knowledge space",
      });
    } else {
      const publishingConfig = ConfigUtils.getPublishing(config);
      out = _.defaultsDeep(publishingConfig, {
        copyAssets: true,
        enablePrettyRefs: true,
        siteFaviconPath: "favicon.ico",
        github: {
          enableEditLink: true,
          editLinkText: "Edit this page on Github",
          editBranch: "main",
          editViewMode: GithubEditViewModeEnum.edit,
        },
        writeStubs: true,
        seo: {
          description: "Personal Knowledge Space",
        },
      });
    }
    const { siteRootDir, siteHierarchies } = out;
    let { siteIndex, siteUrl } = out;
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
    const publishingConfig = ConfigUtils.getPublishingConfig(config);
    siteIndex = this.getSiteIndex(publishingConfig);
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
    config: IntermediateDendronConfig;
  }) {
    const configPath = DConfig.configPath(wsRoot);
    return writeYAML(configPath, config);
  }

  /**
   * Create a backup of dendron.yml with an optional custom infix string.
   * e.g.) createBackup(wsRoot, "foo") will result in a backup file name
   * `dendron.yyyy.MM.dd.HHmmssS.foo.yml`
   * @param wsRoot workspace root
   * @param infix custom string used in the backup name
   */
  static createBackup(wsRoot: string, infix: string): string {
    const configPath = DConfig.configPath(wsRoot);
    const today = Time.now().toFormat("yyyy.MM.dd.HHmmssS");
    const prefix = `dendron.${today}.`;
    const suffix = `yml`;
    const maybeInfix = infix ? `${infix}.` : "";
    const backupName = `${prefix}${maybeInfix}${suffix}`;
    const backupPath = path.join(wsRoot, backupName);
    fs.copyFileSync(configPath, backupPath);
    return backupPath;
  }
}
