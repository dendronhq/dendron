import { DendronConfigEntryCollection } from "./base";
import {
  DendronCommandConfig,
  genDefaultCommandConfig,
} from "./commands/commands";
import {
  DendronWorkspaceConfig,
  genDefaultWorkspaceConfig,
} from "./workspace/workspace";
import {
  DendronPreviewConfig,
  genDefaultPreviewConfig,
} from "./preview/preview";
import {
  DendronPublishingConfig,
  genDefaultPublishingConfig,
} from "./publishing/publishing";
import { DendronGlobalConfig, genDefaultGlobalConfig } from "./global/global";
import { DendronDevConfig, genDefaultDevConfig } from "./dev/dev";
import { GLOBAL } from "../../constants/configs/global";
import { COMMANDS } from "../../constants/configs/commands";
import { WORKSPACE } from "../../constants/configs/workspace";
import { PREVIEW } from "../../constants/configs/preview";
import { PUBLISHING } from "../../constants/configs/publishing";
import { DEV } from "../../constants/configs/dev";

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
  dev?: DendronDevConfig;
};

export type TopLevelDendronConfig = keyof DendronConfig;

/**
 * Constants holding all {@link DendronConfigEntry}
 */
export const DENDRON_CONFIG: DendronConfigEntryCollection<DendronConfig> = {
  global: GLOBAL,
  commands: COMMANDS,
  workspace: WORKSPACE,
  preview: PREVIEW,
  publishing: PUBLISHING,
  dev: DEV,
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
    dev: genDefaultDevConfig(),
  };
}
