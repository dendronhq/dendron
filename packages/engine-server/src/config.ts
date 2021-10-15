import {
  CleanDendronSiteConfig,
  CONSTANTS,
  IntermediateDendronConfig,
  StrictIntermediateDendronConfig,
  CURRENT_CONFIG_VERSION,
  StrictV1,
  StrictV2,
  StrictV3,
  genDefaultCommandConfig,
  genDefaultWorkspaceConfig,
  DendronError,
  DendronSiteConfig,
  ERROR_STATUS,
  ERROR_SEVERITY,
  getStage,
  LegacyLookupSelectionType,
  LegacyNoteAddBehavior,
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

// const requiredPathsMap = new Map<string, string>([
//   ["commands.insertNote.initialValue", "defaultInsertHierarchy"],
//   ["commands.insertNoteLink", "insertNoteLink"],
//   ["commands.insertNoteIndex", "insertNoteIndex"],
//   ["commands.randomNote", "randomNote"],
//   ["commands.lookup", "lookup"],
// ]);
export class DConfig {
  static configPath(configRoot: string): string {
    return path.join(configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  static defaults(
    config: IntermediateDendronConfig
  ): IntermediateDendronConfig {
    return _.defaults(config, { initializeRemoteVaults: true });
  }

  static genDefaultConfig(version?: number): StrictIntermediateDendronConfig {
    const common = {
      useFMTitle: true,
      useNoteTitleForLink: true,
      noLegacyNoteRef: true,
      mermaid: true,
      useKatex: true,
      usePrettyRefs: true,
      dev: {
        enablePreviewV2: true,
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

    const omittedFromV2 = {
      lookupConfirmVaultOnCreate: false,
      lookup: {
        note: {
          selectionType: LegacyLookupSelectionType.selectionExtract,
          leaveTrace: false,
        },
      },
    };

    const omittedFromV3 = {
      vaults: [],
      journal: {
        dailyDomain: "daily",
        name: "journal",
        dateFormat: "y.MM.dd",
        addBehavior: LegacyNoteAddBehavior.childOfDomain,
        firstDayOfWeek: 1,
      },
      scratch: {
        name: "scratch",
        dateFormat: "y.MM.dd.HHmmss",
        addBehavior: LegacyNoteAddBehavior.asOwnDomain,
      },
      noAutoCreateOnDefinition: true,
      noXVaultWikiLink: true,
      autoFoldFrontmatter: true,
      maxPreviewsCached: 10,
    };

    if (_.isUndefined(version)) version = 1;
    switch (version) {
      case 3: {
        return {
          version: 3,
          ...common,
          commands: genDefaultCommandConfig(),
          workspace: genDefaultWorkspaceConfig(),
        } as StrictV3;
      }
      case 2: {
        return {
          version: 2,
          ...common,
          ...omittedFromV3,
          commands: genDefaultCommandConfig(),
        } as StrictV2;
      }
      case 1:
      default: {
        return {
          version: 1,
          ...common,
          ...omittedFromV3,
          ...omittedFromV2,
        } as StrictV1;
      }
    }
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
      ...DConfig.genDefaultConfig(),
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
    const suffix = `yml`;
    const maybeInfix = infix ? `${infix}.` : "";
    const backupName = `${prefix}${maybeInfix}${suffix}`;
    const backupPath = path.join(wsRoot, backupName);
    fs.copyFileSync(configPath, backupPath);
    return backupPath;
  }

  static getConfig(opts: {
    config: StrictIntermediateDendronConfig;
    path: string;
    required?: boolean;
    currentVersion?: number;
  }) {
    const { config, path, required, currentVersion } = _.defaults(opts, {
      currentVersion: CURRENT_CONFIG_VERSION,
    });

    const value = _.get(config, path);
    // if it exists, return no matter what config version we are in.
    if (!_.isUndefined(value)) {
      return value;
    }

    // we failed to grab it.

    // let's see if we can resolve it by looking at how it was configured in the past.
    if (config.version === currentVersion) {
      // config version is up to date.
      // grab from default because it will either
      // 1. be undefined
      // 2. or have an optional but default value.
      return _.get(DConfig.genDefaultConfig(config.version), path);
    }

    const mappedConfigPath = pathMap.get(path);

    if (_.isUndefined(mappedConfigPath)) {
      // it wasn't mapped.

      if (required) {
        // it is a new config that is required, but doesn't have a mapping to old config (a new namespace).
        // grab it from the the default of currentVersion, throw an error with it as a payload.
        // catch it where it's used and handle it accordingly.
        throw new DendronError({
          message: "Required config path doesn't have a mapping.",
          payload: _.get(DConfig.genDefaultConfig(currentVersion), path),
        });
      } else {
        // it's an optional config that we don't have a mapping for.
        // either you didn't map it, or something is wrong.
        throw new DendronError({
          message: "Optional config path doesn't have a mapping.",
          severity: ERROR_SEVERITY.FATAL,
        });
      }
    }

    // we have a mapping
    const { target } = mappedConfigPath;
    const maybeValue = _.get(config, target);

    // we found a value there.
    if (maybeValue) {
      return maybeValue;
    }

    // we couldn't find it there either.
    if (required) {
      // required mapped target doesn't have a value.
      // get default of mapped target on given config's version
      return _.get(DConfig.genDefaultConfig(config.version), target);
    } else {
      // optional mapped target doesn't have a value.
      // mapped target may have a default value, but
      // to conform to the given config's version,
      // return default at _path_ (not mapped) of config.version
      return _.get(DConfig.genDefaultConfig(config.version), path);
    }
  }

  // static getLegacyConfig(config: IntermediateDendronConfig, path: string) {
  //   const mappedLegacyConfigKey = requiredPathsMap.get(path) as keyof IntermediateDendronConfig;
  //   return DConfig.getProp(config, mappedLegacyConfigKey);
  // }

  // static isRequired(path: string) {
  //   return requiredPathsMap.has(path);
  // }

  // static isCurrentConfig(config: StrictIntermediateDendronConfig): config is StrictV2 {
  //   return (config as StrictV2).version === CURRENT_CONFIG_VERSION;
  // }

  // static getConfig(config: IntermediateDendronConfig, path: string) {
  //   const value = _.get(config, path);
  //   if (value) {
  //     // is v2
  //     return value;
  //   }
  //   if (
  //     _.isUndefined(value) &&
  //     !DConfig.isCurrentConfig(
  //       config as StrictIntermediateDendronConfig
  //     )
  //   ) {
  //     // config is v1. fall back to legacy config
  //     return DConfig.getLegacyConfig(config, path);
  //   }

  //   if (_.isUndefined(value) && this.isRequired(path)) {
  //     // config is v2, but it isn't there. Grab v2's default value.
  //     return _.get(DConfig.genDefaultConfig(true), path);
  //   }
  //   return;
  // }
}

type mappedConfigPath = {
  // legacy config path target.
  target: string;
  // on which version revision it was mapped.
  version: number;
};

/**
 * map of paths
 * from new config's path,
 * to old config's path and on which version it was mapped.
 * e.g.
 *    "commands.lookup" is a new config path, that was originally at "lookup".
 *    this mapping was done during the migration that introduced config version 2.
 *
 * only paths that strictly have a mapping is present.
 * newly introduced namespace path (i.e. "commands", or "workspace") is not here
 * because they don't have a mapping to the old version.
 */
const pathMap = new Map<string, mappedConfigPath>([
  // commands namespace

  // lookup namespace
  ["commands.lookup", { target: "lookup", version: 2 }],
  // note lookup namespace
  ["commands.lookup.note", { target: "lookup.note", version: 2 }],
  [
    "commands.lookup.note.selectionMode",
    { target: "lookup.note.selectionType", version: 2 },
  ],
  [
    "commands.lookup.note.confirmVaultOnCreate",
    { target: "lookupConfirmVaultOnCreate", version: 2 },
  ],
  [
    "commands.lookup.note.leaveTrace",
    { target: "lookup.note.leaveTrace", version: 2 },
  ],

  // insertNote namespace
  [
    "commands.insertNote.initialValue",
    { target: "defaultInsertHierarchy", version: 2 },
  ],

  // insertNoteLink namepsace
  ["commands.insertNoteLink", { target: "insertNoteLink", version: 2 }],
  [
    "commands.insertNoteLink.aliasMode",
    { target: "insertNoteLink.aliasMode", version: 2 },
  ],
  [
    "commands.insertNoteLink.enableMultiSelect",
    { target: "insertNoteLink.multiSelect", version: 2 },
  ],

  // insertNoteIndex namespace
  ["commands.insertNoteIndex", { target: "insertNoteIndex", version: 2 }],
  [
    "commands.insertNoteIndex.enableMarker",
    { target: "insertNoteIndex.marker", version: 2 },
  ],

  // randomNote namespace
  ["commands.randomNote", { target: "randomNote", version: 2 }],
  ["commands.randomNote.include", { target: "randomNote.include", version: 2 }],
  ["commands.randomNote.exclude", { target: "randomNote.exclude", version: 2 }],

  // workspace namespace
  ["workspace.dendronVersion", { target: "dendronVersion", version: 3 }],
  ["workspace.workspaces", { target: "workspaces", version: 3 }],
  ["workspace.seeds", { target: "seeds", version: 3 }],
  ["workspace.vaults", { target: "vaults", version: 3 }],
  ["workspace.hooks", { target: "hooks", version: 3 }],

  // journal namespace
  ["workspace.journal", { target: "journal", version: 3 }],
  [
    "workspace.journal.dailyDomain",
    { target: "journal.dailyDomain", version: 3 },
  ],
  ["workspace.journal.dailyVault", { target: "journal", version: 3 }],
  ["workspace.journal.name", { target: "journal.name", version: 3 }],
  [
    "workspace.journal.dateFormat",
    { target: "journal.dateFormat", version: 3 },
  ],
  [
    "workspace.journal.addBehavior",
    { target: "journal.addBehavior", version: 3 },
  ],

  // scratch namespace
  ["workspace.scratch", { target: "scratch", version: 3 }],
  ["workspace.scratch.name", { target: "scratch.name", version: 3 }],
  [
    "workspace.scratch.dateFormat",
    { target: "scratch.dateFormat", version: 3 },
  ],
  [
    "workspace.scratch.addBehavior",
    { target: "scratch.addBehavior", version: 3 },
  ],

  // graph namespace
  ["workspace.graph", { target: "graph", version: 3 }],

  ["workspace.disableTelemetry", { target: "noTelemetry", version: 3 }],
  [
    "workspace.enableAutoCreateOnDefinition",
    { target: "noAutoCreateOnDefinition", version: 3 },
  ],
  [
    "workspace.enableXVaultWikiLink",
    { target: "noXVaultWikiLink", version: 3 },
  ],
  [
    "workspace.enableRemoteVaultInit",
    { target: "initializeRemoteVaults", version: 3 },
  ],
  [
    "workspace.workspaceVaultSyncMode",
    { target: "workspaceVaultSync", version: 3 },
  ],
  [
    "workspace.enableAutoFoldFrontmatter",
    { target: "autoFoldFrontmatter", version: 3 },
  ],
  ["workspace.maxPreviewsCached", { target: "maxPreviewsCached", version: 3 }],
  ["workspace.maxNoteLength", { target: "maxNoteLength", version: 3 }],
  ["workspace.feedback", { target: "feedback", version: 3 }],
  ["workspace.apiEndpoint", { target: "apiEndpoint", version: 3 }],
]);
