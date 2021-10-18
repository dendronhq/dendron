/**
 * Intermediate Dendron Config
 * Holds part of both old and new configs
 * During the migration period.
 */
import { DendronConfig as DendronConfigV1 } from "./workspace";
import { DendronConfig as DendronConfigV2 } from "./configs/dendronConfig";
import _ from "lodash";

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
export type StrictConfigV1 = IntermediateDendronConfig &
  Required<Pick<IntermediateOldConfig, "journal" | "vaults">> & { version: 1 };

/**
 * Strict v2 intermediate config,
 */
export type StrictConfigV2 = IntermediateDendronConfig &
  Required<Pick<IntermediateNewConfig, "commands">> & { version: 2 };

/**
 * Strict v3 intermediate config.
 */
export type StrictConfigV3 = IntermediateDendronConfig &
  Required<Pick<IntermediateNewConfig, "commands" | "workspace">> & {
    version: 3;
  };

/**
 * Union type of all strict config types discriminated by version number.
 */
export type StrictIntermediateDendronConfig =
  | StrictConfigV1
  | StrictConfigV2
  | StrictConfigV3;

/**
 * Type guards
 */
export function configIsV1(
  config: IntermediateDendronConfig
): config is StrictConfigV1 {
  return config.version === 1;
}

export function configIsV2(
  config: IntermediateDendronConfig
): config is StrictConfigV2 {
  return config.version === 2;
}

export function configIsV3(
  config: IntermediateDendronConfig
): config is StrictConfigV3 {
  return config.version === 3;
}

export function configIsAtLeastV3(opts: {
  config: IntermediateDendronConfig;
  strict?: boolean;
}) {
  const { config, strict } = _.defaults(opts, { strict: true });
  const hasWorkspace = strict ? "workspace" in config : true;
  return config.version >= 3 && hasWorkspace;
}

export function configIsAtLeastV2(opts: {
  config: IntermediateDendronConfig;
  strict?: boolean;
}) {
  const { config, strict } = _.defaults(opts, { strict: true });
  const hasCommands = strict ? "commands" in config : true;
  return config.version >= 2 && hasCommands;
}
