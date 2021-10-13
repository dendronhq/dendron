import {
  CleanDendronSiteConfig,
  CONSTANTS,
  IntermediateDendronConfig,
  StrictIntermediateDendronConfig,
  CURRENT_CONFIG_VERSION,
  StrictV1,
  StrictV2,
  genDefaultCommandConfig,
  DendronError,
  DendronSiteConfig,
  ERROR_STATUS,
  getStage,
  LegacyLookupSelectionType,
  NoteAddBehavior,
  Time,
} from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export class ConfigUtils {
  static usePrettyRef(config: IntermediateDendronConfig) {
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

const requiredPathsMap = new Map<string, string>([
  ["commands.insertNote.initialValue", "defaultInsertHierarchy"],
  ["commands.insertNoteLink", "insertNoteLink"],
  ["commands.insertNoteIndex", "insertNoteIndex"],
  ["commands.randomNote", "randomNote"],
  ["commands.lookup", "lookup"],
]);
export class DConfig {
  static configPath(configRoot: string): string {
    return path.join(configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  static defaults(
    config: IntermediateDendronConfig
  ): IntermediateDendronConfig {
    return _.defaults(config, { initializeRemoteVaults: true });
  }

  static genDefaultConfig(current?: boolean): StrictIntermediateDendronConfig {
    const common = {
      maxPreviewsCached: 10,
      vaults: [],
      useFMTitle: true,
      useNoteTitleForLink: true,
      noAutoCreateOnDefinition: true,
      noLegacyNoteRef: true,
      noXVaultWikiLink: true,
      mermaid: true,
      useKatex: true,
      autoFoldFrontmatter: true,
      usePrettyRefs: true,
      dev: {
        enablePreviewV2: true,
      },
      journal: {
        dailyDomain: "daily",
        name: "journal",
        dateFormat: "y.MM.dd",
        addBehavior: NoteAddBehavior.childOfDomain,
        firstDayOfWeek: 1,
      },
      scratch: {
        name: "scratch",
        dateFormat: "y.MM.dd.HHmmss",
        addBehavior: NoteAddBehavior.asOwnDomain,
      },
      site: {
        copyAssets: true,
        siteHierarchies: ["root"],
        siteRootDir: "docs",
        usePrettyRefs: true,
        title: "Dendron",
        description: "Personal knowledge space",
        siteLastModified: true,
        gh_edit_branch: "main",
      },
    };

    if (current) {
      return { 
        ...common,
        version: 2,
        commands: genDefaultCommandConfig(),
      } as StrictV2;
    } else {
      return {
        ...common,
        version: 1,
        lookupConfirmVaultOnCreate: false,
        lookup: {
          note: {
            selectionType: LegacyLookupSelectionType.selectionExtract,
            leaveTrace: false,
          },
        },
      } as StrictV1;
    }
  }

  /**
   * Get without filling in defaults
   * @param wsRoot
   */
  static getRaw(wsRoot: string) {
    const configPath = DConfig.configPath(wsRoot);
    const config = readYAML(configPath) as Partial<
      IntermediateDendronConfig
    >;
    return config;
  }

  static getOrCreate(
    dendronRoot: string,
    defaults?: Partial<IntermediateDendronConfig>
  ): IntermediateDendronConfig {
    const configPath = DConfig.configPath(dendronRoot);
    let config: IntermediateDendronConfig = { 
      ...defaults, 
      ...DConfig.genDefaultConfig() 
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

  /**
   * Get config value with consideration for defaults
   * @param config
   */
  static getProp<K extends keyof IntermediateDendronConfig>(
    config: IntermediateDendronConfig,
    key: K
  ): IntermediateDendronConfig[K] {
    const cConfig = _.defaults(
      config,
      this.genDefaultConfig()
    ) as Required<IntermediateDendronConfig>;
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
      gh_edit_branch: "main",
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
    const suffix = `yml`
    const maybeInfix = infix ? `${infix}.` : "";
    const backupName = `${prefix}${maybeInfix}${suffix}`;
    const backupPath = path.join(wsRoot, backupName);
    fs.copyFileSync(configPath, backupPath);
    return backupPath;
  }

  static getLegacyConfig(config: IntermediateDendronConfig, path: string) {
    const mappedLegacyConfigKey = requiredPathsMap.get(path) as keyof IntermediateDendronConfig;
    return DConfig.getProp(config, mappedLegacyConfigKey);
  }

  static isRequired(path: string) {
    return requiredPathsMap.has(path);
  }

  
  static isCurrentConfig(config: StrictIntermediateDendronConfig): config is StrictV2 {
    return (config as StrictV2).version === CURRENT_CONFIG_VERSION;
  }

  static getConfig(config: IntermediateDendronConfig, path: string) {
    const value = _.get(config, path);
    if (value) {
      // is v2
      return value;
    }
    if (
      _.isUndefined(value) && 
      !DConfig.isCurrentConfig(
        config as StrictIntermediateDendronConfig
      )
    ) {
      // config is v1. fall back to legacy config
      return DConfig.getLegacyConfig(config, path);
    }

    if (_.isUndefined(value) && this.isRequired(path)) {
      // config is v2, but it isn't there. Grab v2's default value.
      return _.get(DConfig.genDefaultConfig(true), path);
    }
    return;
  }
}
