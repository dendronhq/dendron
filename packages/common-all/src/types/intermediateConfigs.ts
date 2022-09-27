/**
 * Intermediate Dendron Config
 * Holds part of both old and new configs
 * During the migration period.
 */
import { DendronConfig as DendronConfigV1 } from "./configs/dendronConfigLegacy";
import { DendronConfig as DendronConfigV2 } from "./configs/dendronConfig";
import _ from "lodash";

export * from "./configs";

export const CURRENT_CONFIG_VERSION = 5;
/**
 * Partial of the old config, but respect the required keys
 * that are not yet in the process of migration.
 */
type IntermediateOldConfig = Partial<DendronConfigV1> &
  Required<Pick<DendronConfigV1, "version">>;

/**
 * Partial of the new config, may only contain keys
 * that are currently in the process of, or completed migration.
 */
type IntermediateNewConfig = Partial<
  Pick<DendronConfigV2, "commands" | "workspace" | "preview" | "publishing">
>;

export type IntermediateDendronConfig = StrictConfigV4 | StrictConfigV5;

// note: this is _only_ used to generate the JSON schema for validation.
// ts-json-schema-generator doesn't handle intersecting properties in union types very well,
// so this type is hand picked to pass it to the generator.
// do not use it in codebase other than schema generation.
export type ConfigForSchemaGenerator = Partial<IntermediateNewConfig> &
  Partial<
    Pick<
      IntermediateOldConfig,
      | "dev"
      | "site"
      | "useFMTitle"
      | "useKatex"
      | "mermaid"
      | "useNoteTitleForLink"
      | "hierarchyDisplay"
      | "hierarchyDisplayTitle"
    >
  > & {
    version: 4 | 5;
  };

/**
 * Strict intermediate config types.
 */
export type StrictConfigV4 = IntermediateOldConfig &
  IntermediateNewConfig &
  Required<Pick<IntermediateNewConfig, "commands" | "workspace" | "preview">> &
  Required<Pick<IntermediateOldConfig, "site">> & {
    version: 4;
  };

export type StrictConfigV5 = IntermediateOldConfig &
  IntermediateNewConfig &
  Required<
    Pick<
      IntermediateNewConfig,
      "commands" | "workspace" | "preview" | "publishing"
    >
  > & {
    version: 5;
  };

/**
 * Type guards
 */

export function configIsV4(
  config: IntermediateDendronConfig
): config is StrictConfigV4 {
  return config.version === 4;
}

export function configIsV5(
  config: IntermediateDendronConfig
): config is StrictConfigV5 {
  return config.version === 5;
}
