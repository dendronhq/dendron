import { CopyNoteLinkConfig, genDefaultCopyNoteLinkConfig } from ".";
import {
  genDefaultInsertNoteIndexConfig,
  InsertNoteIndexConfig,
} from "./insertNoteIndex";
import {
  genDefaultInsertNoteLinkConfig,
  InsertNoteLinkConfig,
} from "./insertNoteLink";
import { genDefaultLookupConfig, LookupConfig } from "./lookup";
import { genDefaultRandomNoteConfig, RandomNoteConfig } from "./randomNote";

/**
 * Namespace for all command related configurations
 */
export type DendronCommandConfig = {
  lookup: LookupConfig;
  randomNote: RandomNoteConfig;
  insertNoteLink: InsertNoteLinkConfig;
  insertNoteIndex: InsertNoteIndexConfig;
  copyNoteLink: CopyNoteLinkConfig;
  /**
   * Default template hiearchy used when running commands like `Apply template`
   */
  templateHierarchy?: string;
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
    insertNoteLink: genDefaultInsertNoteLinkConfig(),
    insertNoteIndex: genDefaultInsertNoteIndexConfig(),
    copyNoteLink: genDefaultCopyNoteLinkConfig(),
    templateHierarchy: "template",
  };
}
