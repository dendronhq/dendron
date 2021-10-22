import _ from "lodash";

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
};

/**
 * Used as an function to map a config that has been flipped during migration.
 * @param value boolean value
 * @returns flipped boolean value
 */
const FLIP = (value: boolean): boolean => !value;

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
]);

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
}
