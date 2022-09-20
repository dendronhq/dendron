import { HierarchyConfig, LegacyHierarchyConfig } from "@dendronhq/common-all";
import _ from "lodash";
import { MigrationChangeSetStatus } from "./types";

type mappedConfigPath = {
  /**
   * legacy config path to target.
   */
  target: string;
  /**
   * How we want to map the config.
   * if "skip", don't map.
   *   use this when it is a namespace that itself has properties.
   * if undefined, identity mapping is assumed (_.identity)
   */
  iteratee?: Function | "skip";
  /**
   * Set to true to mark that legacy path should be preserved.
   */
  preserve?: boolean;
};

/**
 * Used as an function to map a config that has been flipped during migration.
 * @param value boolean value
 * @returns flipped boolean value
 */
const FLIP = (value: boolean): boolean => !value;

/**
 * Used as a function to map a string representation of a boolean value to a corresponding boolean type during migration.
 * @param value string value
 * @returns boolean value
 */
const toBoolean = (value: string): boolean =>
  value.toString().toLowerCase() === "true";

/**
 * map of new config's path to old config's path and how it should be mapped.
 * e.g.
 *    "commands.lookup" is a new config path, that was originally at "lookup".
 *    This mapping should be skipped during migration.
 *
 *    "commands.lookup.note.selectionMode" is a new config path
 *    that was originally "lookup.note.selectionType".
 *    This mapping should be done by _iteratee_, which maps to the new enums.
 *
 * only paths that strictly have a mapping is present.
 * newly introduced namespace path (i.e. "commands", or "workspace") is not here
 * because they don't have a mapping to the old version.
 */
export const PATH_MAP = new Map<string, mappedConfigPath>([
  // commands namespace

  // lookup namespace
  ["commands.lookup", { target: "lookup", iteratee: "skip" }],
  // note lookup namespace
  ["commands.lookup.note", { target: "lookup.note", iteratee: "skip" }],
  [
    "commands.lookup.note.selectionMode",
    {
      target: "lookup.note.selectionType",
      iteratee: (value: any) => {
        switch (value) {
          case "selection2link": {
            return "link";
          }
          case "none": {
            return "none";
          }
          case "selectionExtract":
          default: {
            return "extract";
          }
        }
      },
    },
  ],
  [
    "commands.lookup.note.confirmVaultOnCreate",
    { target: "lookupConfirmVaultOnCreate" },
  ],
  ["commands.lookup.note.leaveTrace", { target: "lookup.note.leaveTrace" }],
  [
    "commands.lookup.note.bubbleUpCreateNew",
    { target: "lookupDontBubbleUpCreateNew", iteratee: FLIP },
  ],

  // insertNote namespace
  ["commands.insertNote.initialValue", { target: "defaultInsertHierarchy" }],

  // insertNoteLink namepsace
  ["commands.insertNoteLink", { target: "insertNoteLink", iteratee: "skip" }],
  ["commands.insertNoteLink.aliasMode", { target: "insertNoteLink.aliasMode" }],
  [
    "commands.insertNoteLink.enableMultiSelect",
    { target: "insertNoteLink.multiSelect" },
  ],

  // insertNoteIndex namespace
  ["commands.insertNoteIndex", { target: "insertNoteIndex", iteratee: "skip" }],
  [
    "commands.insertNoteIndex.enableMarker",
    { target: "insertNoteIndex.marker" },
  ],

  // randomNote namespace
  ["commands.randomNote", { target: "randomNote", iteratee: "skip" }],
  ["commands.randomNote.include", { target: "randomNote.include" }],
  ["commands.randomNote.exclude", { target: "randomNote.exclude" }],

  // workspace namespace
  ["workspace.dendronVersion", { target: "dendronVersion" }],
  ["workspace.workspaces", { target: "workspaces" }],
  ["workspace.seeds", { target: "seeds" }],
  ["workspace.vaults", { target: "vaults" }],
  ["workspace.hooks", { target: "hooks" }],

  // journal namespace
  ["workspace.journal", { target: "journal", iteratee: "skip" }],
  ["workspace.journal.dailyDomain", { target: "journal.dailyDomain" }],
  ["workspace.journal.dailyVault", { target: "journal.dailyVault" }],
  ["workspace.journal.name", { target: "journal.name" }],
  ["workspace.journal.dateFormat", { target: "journal.dateFormat" }],
  ["workspace.journal.addBehavior", { target: "journal.addBehavior" }],

  // scratch namespace
  ["workspace.scratch", { target: "scratch", iteratee: "skip" }],
  ["workspace.scratch.name", { target: "scratch.name" }],
  ["workspace.scratch.dateFormat", { target: "scratch.dateFormat" }],
  ["workspace.scratch.addBehavior", { target: "scratch.addBehavior" }],

  // graph namespace
  ["workspace.graph", { target: "graph", iteratee: "skip" }],
  ["workspace.graph.zoomSpeed", { target: "graph.zoomSpeed" }],

  ["workspace.disableTelemetry", { target: "noTelemetry" }],
  [
    "workspace.enableAutoCreateOnDefinition",
    { target: "noAutoCreateOnDefinition", iteratee: FLIP },
  ],
  [
    "workspace.enableXVaultWikiLink",
    { target: "noXVaultWikiLink", iteratee: FLIP },
  ],
  ["workspace.enableRemoteVaultInit", { target: "initializeRemoteVaults" }],
  ["workspace.workspaceVaultSyncMode", { target: "workspaceVaultSync" }],
  ["workspace.enableAutoFoldFrontmatter", { target: "autoFoldFrontmatter" }],
  ["workspace.maxPreviewsCached", { target: "maxPreviewsCached" }],
  ["workspace.maxNoteLength", { target: "maxNoteLength" }],
  ["workspace.feedback", { target: "feedback" }],
  ["workspace.apiEndpoint", { target: "apiEndpoint" }],

  // preview namespace
  ["preview.enableFMTitle", { target: "useFMTitle", preserve: true }],
  [
    "preview.enableHierarchyDisplay",
    { target: "hierarchyDisplay", preserve: true },
  ],
  [
    "preview.hierarchyDisplayTitle",
    { target: "hierarchyDisplayTitle", preserve: true },
  ],
  [
    "preview.enableNoteTitleForLink",
    { target: "useNoteTitleForLink", preserve: true },
  ],
  ["preview.enableMermaid", { target: "mermaid", preserve: true }],
  ["preview.enablePrettyRefs", { target: "usePrettyRefs" }],
  ["preview.enableKatex", { target: "useKatex", preserve: true }],

  // publishing namespace
  ["publishing", { target: "site", iteratee: "skip" }],
  ["publishing.enableFMTitle", { target: "useFMTitle" }],
  ["publishing.enableHierarchyDisplay", { target: "hierarchyDisplay" }],
  ["publishing.hierarchyDisplayTitle", { target: "hierarchyDisplayTitle" }],
  ["publishing.enableNoteTitleForLink", { target: "useNoteTitleForLink" }],
  ["publishing.enableMermaid", { target: "mermaid" }],
  ["publishing.enablePrettyRefs", { target: "site.usePrettyRefs" }],
  ["publishing.enableKatex", { target: "useKatex" }],
  ["publishing.assetsPrefix", { target: "site.assetsPrefix" }],
  ["publishing.copyAssets", { target: "site.copyAssets" }],
  ["publishing.canonicalBaseUrl", { target: "site.canonicalBaseUrl" }],
  ["publishing.customHeaderPath", { target: "site.customHeaderPath" }],
  ["publishing.ga.tracking", { target: "site.ga_tracking" }],
  ["publishing.logoPath", { target: "site.logo" }],
  ["publishing.siteFaviconPath", { target: "site.siteFaviconPath" }],
  ["publishing.siteIndex", { target: "site.siteIndex" }],
  ["publishing.siteHierarchies", { target: "site.siteHierarchies" }],
  ["publishing.enableSiteLastModified", { target: "site.siteLastModified" }],
  ["publishing.siteRootDir", { target: "site.siteRootDir" }],
  ["publishing.siteUrl", { target: "site.siteUrl" }],
  ["publishing.enableFrontmatterTags", { target: "site.showFrontMatterTags" }],
  ["publishing.enableHashesForFMTags", { target: "site.useHashesForFMTags" }],
  [
    "publishing.enableRandomlyColoredTags",
    { target: "site.noRandomlyColoredTags", iteratee: FLIP },
  ],
  [
    "publishing.hierarchy",
    {
      target: "site.config",
      iteratee: (hconfig: LegacyHierarchyConfig) => {
        const tmp = {} as HierarchyConfig;
        _.forEach(_.keys(hconfig), (key: string) => {
          _.set(tmp, key, _.omit(_.get(hconfig, key), "noindexByDefault"));
        });
        return tmp;
      },
    },
  ],
  [
    "publishing.duplicateNoteBehavior",
    { target: "site.duplicateNoteBehavior" },
  ],
  ["publishing.writeStubs", { target: "site.writeStubs" }],
  ["publishing.seo.title", { target: "site.title" }],
  ["publishing.seo.description", { target: "site.description" }],
  ["publishing.seo.author", { target: "site.author" }],
  ["publishing.seo.twitter", { target: "site.twitter" }],
  ["publishing.seo.image", { target: "site.image" }],
  ["publishing.github.cname", { target: "site.githubCname" }],
  [
    "publishing.github.enableEditLink",
    { target: "site.gh_edit_link", iteratee: toBoolean },
  ],
  ["publishing.github.editLinkText", { target: "site.gh_edit_link_text" }],
  ["publishing.github.editBranch", { target: "site.gh_edit_branch" }],
  ["publishing.github.editViewMode", { target: "site.gh_edit_view_mode" }],
  ["publishing.github.editRepository", { target: "site.gh_edit_repository" }],
  ["publishing.segmentKey", { target: "site.segmentKey" }],
  ["publishing.cognitoUserPoolId", { target: "site.cognitoUserPoolId" }],
  ["publishing.cognitoClientId", { target: "site.cognitoClientId" }],
  ["publishing.enablePrettyLinks", { target: "site.usePrettyLinks" }],
]);

/** ^2hgqigv11pvy
 * List of config paths that are deprecated
 * and should be checked for existence
 * and deleted from `dendron.yml`
 */
export const DEPRECATED_PATHS = [
  "useNunjucks",
  "noLegacyNoteRef",
  "site.siteNotesDir",
  "site.siteRepoDir",
  "site.previewPort",
  "site.useContainers",
  "site.generateChangelog",
  "dev.enableWebUI",
  "workspace.enableHandlebarTemplates",
  "workspace.enableSmartRefs",
  "preview.enableMermaid",
  "enableMermaid",
  "publishing.enableMermaid",
];

export class MigrationUtils {
  /**
   * clean up an object recursively with given predicate.
   * @param obj a plain object
   * @param pred predicate to use for recursively omitting
   * @returns obj, with properties omitted by pred
   */
  static deepCleanObjBy(obj: any, pred: Function): any {
    const out = _.omitBy(obj, pred);
    _.keys(out).forEach((key) => {
      if (_.isPlainObject(out[key])) {
        out[key] = MigrationUtils.deepCleanObjBy(out[key], pred);
      }
    });
    return out;
  }

  static getMigrationAnalyticProps({
    data: { changeName, status, version },
  }: MigrationChangeSetStatus) {
    return {
      data: {
        changeName,
        status,
        version,
      },
    };
  }
}
