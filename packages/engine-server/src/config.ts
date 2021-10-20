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
export const pathMap = new Map<string, mappedConfigPath>([
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
  [
    "workspace.journal.dailyVault",
    { target: "journal.dailyVault", version: 3 },
  ],
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
  ["workspace.graph.zoomSpeed", { target: "graph.zoomSpeed", version: 3 }],

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
