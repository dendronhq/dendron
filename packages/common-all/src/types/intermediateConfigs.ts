/**
 * Intermediate Dendron Config
 * Holds part of both old and new configs
 * During the migration period.
 */
import { DendronConfig as DendronConfigV1 } from "./workspace";
import { DendronConfig as DendronConfigV2 } from "./configs/dendronConfig";
import _ from "lodash";

export * from "./configs";

export const CURRENT_CONFIG_VERSION = 4;
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
  Pick<DendronConfigV2, "commands" | "workspace" | "preview">
>;

export type IntermediateDendronConfig = IntermediateOldConfig &
  IntermediateNewConfig;

/**
 * Strict v4 intermediate config.
 */
export type StrictConfigV4 = IntermediateDendronConfig &
  Required<
    Pick<IntermediateNewConfig, "commands" | "workspace" | "preview">
  > & {
    version: 4;
  };

/**
 * Type guards
 */

export function configIsV4(
  config: IntermediateDendronConfig
): config is StrictConfigV4 {
  return config.version === 4;
}
