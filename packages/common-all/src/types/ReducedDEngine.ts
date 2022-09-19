import { DEngine } from "./typesv2";

/**
 * Subset of DEngine capabilities designed to support Dendron as a Web Extension
 */
export type ReducedDEngine = Pick<
  DEngine,
  | "getNote"
  | "getNoteMeta"
  | "bulkGetNotes"
  | "bulkGetNotesMeta"
  | "findNotes"
  | "findNotesMeta"
  | "deleteNote"
  | "bulkWriteNotes"
  | "writeNote"
  | "renameNote"
  | "queryNotes"
>;
