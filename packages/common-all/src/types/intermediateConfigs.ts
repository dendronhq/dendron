/**
 * Intermediate Dendron Config
 * Holds part of both old and new configs
 * During the migration period.
 */
import { 
  DendronConfig as DendronConfigV1,
  LegacyRandomNoteConfig,
  LegacyInsertNoteLinkConfig,
  LegacyInsertNoteIndexConfig,
} from "./workspace";
import { DendronConfig as DendronConfigV2 } from "./configs/dendronConfig";
import { genDefaultCommandConfig } from "./configs/commands/commands";
import { RandomNoteConfig, InsertNoteLinkConfig, InsertNoteIndexConfig } from "./configs/commands";

export * from "./configs";
export type IntermediateDendronConfig = IntermediateOldConfig & IntermediateNewConfig;

/**
 * Partial of the old config, but respect the required keys
 * that are not yet in the process of migration.
 */
type IntermediateOldConfig = Partial<DendronConfigV1> 
  & Required<Pick<DendronConfigV1, 
  | "version"
  | "site"
  | "journal"
  | "vaults"
  | "lookup"
>>;

/**
 * Partial of the new config, may only contain keys
 * that are currently in the process of, or completed migration.
 */
type IntermediateNewConfig = Partial<Pick<DendronConfigV2,
  | "commands"
>>

/**
 * Given an intermediate dendron config, return 
 * new random note config if command namespace exists
 * old random note config (or undefined) otherwise
 * @param config 
 * @returns 
 */
function getRandomNoteConfig(
  config: IntermediateDendronConfig
): RandomNoteConfig | LegacyRandomNoteConfig | undefined {
  const keys = Object.keys(config);
  // new config exists
  if (keys.includes("commands")) {
    return config["commands"]!["randomNote"];
  }

  // old config exists
  if (keys.includes("randomNote")) {
    return config["randomNote"] as LegacyRandomNoteConfig;
  }

  // doesn't exist.
  return;
}

function getDefaultInsertHierarchy(
  config: IntermediateDendronConfig
): string | undefined {
  const keys = Object.keys(config);
  if (keys.includes("commands")) {
    return config["commands"]!["insertNote"].initialValue;
  }

  if (keys.includes("defaultInsertHierarchy")) {
    return config["defaultInsertHierarchy"];
  }

  return;
}

function getInsertNoteLinkConfig(
  config: IntermediateDendronConfig
): InsertNoteLinkConfig | LegacyInsertNoteLinkConfig | undefined {
  const keys = Object.keys(config);
  if (keys.includes("commands")) {
    return config["commands"]!["insertNoteLink"];
  }

  if (keys.includes("insertNoteLink")) {
    return config["insertNoteLink"];
  }

  return;
}

function getInsertNoteIndexConfig(
  config: IntermediateDendronConfig
): InsertNoteIndexConfig | LegacyInsertNoteIndexConfig | undefined {
  const keys = Object.keys(config);
  if(keys.includes("commands")) {
    return config["commands"]!["insertNoteIndex"];
  }

  if (keys.includes("insertNoteIndex")) {
    return config["insertNoteIndex"];
  }

  return;
}

export const IntermediateDendronConfigUtils = {
  genDefaultCommandConfig,
  getRandomNoteConfig,
  getDefaultInsertHierarchy,
  getInsertNoteLinkConfig,
  getInsertNoteIndexConfig,
};
