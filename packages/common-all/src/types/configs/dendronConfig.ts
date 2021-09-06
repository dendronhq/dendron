import {
  DendronCommandConfig,
  genDefaultCommandConfig,
  COMMANDS,
} from "./commands/commands";
import {
  DendronWorkspaceConfig,
  genDefaultWorkspaceConfig,
  WORKSPACE,
} from "./workspace/workspace";

/**
 * DendronConfig
 * This is the top level config that will hold everything.
 */
export type DendronConfig = {
  commands: DendronCommandConfig;
  workspace: DendronWorkspaceConfig;
};

/**
 * Constants holding all {@link DendronConfigEntry}
 */
export const DENDRON_CONFIG = {
  COMMANDS,
  WORKSPACE,
};

/**
 * Generates a default DendronConfig using
 * respective default config generators of each sub config groups.
 * @returns DendronConfig
 */
export function genDefaultDendronConfig(): DendronConfig {
  return {
    commands: genDefaultCommandConfig(),
    workspace: genDefaultWorkspaceConfig(),
  };
}
