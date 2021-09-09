import {
  genDefaultInsertNoteLinkConfig,
  InsertNoteLinkConfig,
  INSERT_NOTE_LINK,
} from "./insertNoteLink";
import { genDefaultLookupConfig, LookupConfig, LOOKUP } from "./lookup";
import {
  genDefaultInsertNoteIndexConfig,
  InsertNoteIndexConfig,
  INSERT_NOTE_INDEX,
} from "./insertNoteIndex";

/**
 * Namespace for all command related configurations
 */
export type DendronCommandConfig = {
  lookup: LookupConfig;
  insertNoteLink: InsertNoteLinkConfig;
  insertNoteIndex: InsertNoteIndexConfig;
};

/**
 * Constants holding all command config related {@link DendronConfigEntry}
 */
export const COMMANDS = {
  LOOKUP,
  INSERT_NOTE_LINK,
  INSERT_NOTE_INDEX,
};

/**
 * Generates default {@link DendronCommandConfig} using
 * respective default config generators that each command config implements.
 * @returns DendronCommandConfig
 */
export function genDefaultCommandConfig(): DendronCommandConfig {
  return {
    lookup: genDefaultLookupConfig(),
    insertNoteLink: genDefaultInsertNoteLinkConfig(),
    insertNoteIndex: genDefaultInsertNoteIndexConfig(),
  };
}
