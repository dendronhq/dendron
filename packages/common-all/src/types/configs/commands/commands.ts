import {
  genDefaultInsertNoteLinkConfig,
  InsertNoteLinkConfig,
} from "./insertNoteLink";
import { genDefaultLookupConfig, LookupConfig } from "./lookup";

export type DendronCommandConfig = {
  lookup: LookupConfig;
  insertNoteLink: InsertNoteLinkConfig;
};

export function genDefaultCommandConfig(): DendronCommandConfig {
  return {
    lookup: genDefaultLookupConfig(),
    insertNoteLink: genDefaultInsertNoteLinkConfig(),
  };
}
