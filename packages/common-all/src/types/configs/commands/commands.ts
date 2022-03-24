import {
  genDefaultInsertNoteLinkConfig,
  InsertNoteLinkConfig,
} from "./insertNoteLink";
import { genDefaultLookupConfig, LookupConfig } from "./lookup";
import {
  genDefaultInsertNoteIndexConfig,
  InsertNoteIndexConfig,
} from "./insertNoteIndex";
import { genDefaultRandomNoteConfig, RandomNoteConfig } from "./randomNote";
import { genDefaultInsertNoteConfig, InsertNoteConfig } from "./insertNote";
import { CopyNoteLinkConfig, genDefaultCopyNoteLinkConfig } from ".";

/**
 * Namespace for all command related configurations
 */
export type DendronCommandConfig = {
  lookup: LookupConfig;
  randomNote: RandomNoteConfig;
  insertNote: InsertNoteConfig;
  insertNoteLink: InsertNoteLinkConfig;
  insertNoteIndex: InsertNoteIndexConfig;
  copyNoteLink: CopyNoteLinkConfig;
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
    copyNoteLink: genDefaultCopyNoteLinkConfig(),
  };
}
