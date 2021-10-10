/**
 * Intermediate Dendron Config
 * Holds part of both old and new configs
 * During the migration period.
 */
import { 
  DendronConfig as DendronConfigV1,
} from "./workspace";
import { DendronConfig as DendronConfigV2 } from "./configs/dendronConfig";

export * from "./configs";

export const CURRENT_CONFIG_VERSION = 2;
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
>>;

/**
 * Partial of the new config, may only contain keys
 * that are currently in the process of, or completed migration.
 */
type IntermediateNewConfig = Partial<Pick<DendronConfigV2,
  | "commands"
>>

export type IntermediateDendronConfig = IntermediateOldConfig & IntermediateNewConfig;

export type StrictV1 = IntermediateDendronConfig & { version: 1 };
export type StrictV2 = IntermediateDendronConfig & { version: 2 };

export type StrictIntermediateDendronConfig = StrictV1 | StrictV2;

