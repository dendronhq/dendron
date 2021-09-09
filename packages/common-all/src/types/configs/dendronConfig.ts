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
import {
  DendronPreviewConfig,
  genDefaultPreviewConfig,
  PREVIEW,
} from "./preview/preview";
import {
  DendronPublishingConfig,
  genDefaultPublishingConfig,
  PUBLISHING,
} from "./publishing/publishing";
import {
  DendronGlobalConfig,
  genDefaultGlobalConfig,
  GLOBAL,
} from "./global/global";

/**
 * DendronConfig
 * This is the top level config that will hold everything.
 */
export type DendronConfig = {
  global: DendronGlobalConfig;
  commands: DendronCommandConfig;
  workspace: DendronWorkspaceConfig;
  preview: DendronPreviewConfig;
  publishing: DendronPublishingConfig;
};

export type TopLevelDendronConfig = keyof DendronConfig;

/**
 * Constants holding all {@link DendronConfigEntry}
 */
export const DENDRON_CONFIG = {
  GLOBAL,
  COMMANDS,
  WORKSPACE,
  PREVIEW,
  PUBLISHING,
};

/**
 * Generates a default DendronConfig using
 * respective default config generators of each sub config groups.
 * @returns DendronConfig
 */
export function genDefaultDendronConfig(): DendronConfig {
  return {
    global: genDefaultGlobalConfig(),
    commands: genDefaultCommandConfig(),
    workspace: genDefaultWorkspaceConfig(),
    preview: genDefaultPreviewConfig(),
    publishing: genDefaultPublishingConfig(),
  };
}
