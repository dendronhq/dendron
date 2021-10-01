/**
 * Intermediate Dendron Config
 * Holds part of both old and new configs
 * During the migration period.
 */
import { DendronConfig as DendronConfigV1 } from "./workspace";
import { DendronConfig as DendronConfigV2 } from "./configs/dendronConfig";
import { genDefaultCommandConfig } from "./configs/commands/commands";

export * from "./configs";
export type IntermediateDendronConfig = IntermediateOldConfig & IntermediateNewConfig;

// omit all command related legacy configs
// type IntermediateOldConfig = Omit<DendronConfigV1, 
//   | "lookup"
//   | "lookupConfirmVaultOnCreate"
//   | "insertNoteLink"
//   | "insertNoteIndex"
//   | "randomNote"
// >;
type IntermediateOldConfig = DendronConfigV1;

// 
type IntermediateNewConfig = Pick<DendronConfigV2,
  | "commands"
>

export const IntermediateDendronConfigUtils = {
  genDefaultCommandConfig
};
