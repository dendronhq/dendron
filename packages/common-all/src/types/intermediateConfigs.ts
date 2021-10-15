/**
 * Intermediate Dendron Config
 * Holds part of both old and new configs
 * During the migration period.
 */
import { DendronConfig as DendronConfigV1 } from "./workspace";
import { DendronConfig as DendronConfigV2 } from "./configs/dendronConfig";

export * from "./configs";

export const CURRENT_CONFIG_VERSION = 3;
/**
 * Partial of the old config, but respect the required keys
 * that are not yet in the process of migration.
 */
type IntermediateOldConfig = Partial<DendronConfigV1> &
  Required<Pick<DendronConfigV1, "version" | "site">>;

/**
 * Partial of the new config, may only contain keys
 * that are currently in the process of, or completed migration.
 */
type IntermediateNewConfig = Partial<
  Pick<DendronConfigV2, "commands" | "workspace">
>;

export type IntermediateDendronConfig = IntermediateOldConfig &
  IntermediateNewConfig;

/**
 * Strict v1 intermediate config,
 */
export type StrictV1 = IntermediateDendronConfig &
  Required<Pick<IntermediateOldConfig, "journal" | "vaults">> & { version: 1 };

/**
 * Strict v2 intermediate config,
 */
export type StrictV2 = IntermediateDendronConfig &
  Required<Pick<IntermediateNewConfig, "commands">> & { version: 2 };

/**
 * Strict v3 intermediate config.
 */
export type StrictV3 = IntermediateDendronConfig &
  Required<Pick<IntermediateNewConfig, "commands" | "workspace">> & {
    version: 3;
  };

/**
 * Union type of all strict config types discriminated by version number.
 */
export type StrictIntermediateDendronConfig = StrictV1 | StrictV2 | StrictV3;
