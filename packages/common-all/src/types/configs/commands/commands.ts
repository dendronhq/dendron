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
import {
  genDefaultRandomNoteConfig,
  RandomNoteConfig,
  RANDOM_NOTE,
} from "./randomNote";
import {
  genDefaultInsertNoteConfig,
  InsertNoteConfig,
  INSERT_NOTE,
} from "./insertNote";

/**
 * Namespace for all command related configurations
 */
export type DendronCommandConfig = {
  lookup: LookupConfig;
  randomNote?: RandomNoteConfig;
  insertNote: InsertNoteConfig;
  insertNoteLink?: InsertNoteLinkConfig;
  insertNoteIndex?: InsertNoteIndexConfig;
};

/**
 * Constants holding all command config related {@link DendronConfigEntry}
 */
export const COMMANDS = {
  LOOKUP,
  RANDOM_NOTE,
  INSERT_NOTE,
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
    randomNote: genDefaultRandomNoteConfig(),
    insertNote: genDefaultInsertNoteConfig(),
    insertNoteLink: genDefaultInsertNoteLinkConfig(),
    insertNoteIndex: genDefaultInsertNoteIndexConfig(),
  };
}
