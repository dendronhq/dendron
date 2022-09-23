import {
  DendronCommandConfig,
  genDefaultCommandConfig,
} from "./commands/commands";
import {
  DendronWorkspaceConfig,
  genDefaultWorkspaceConfig,
} from "./workspace/DendronWorkspaceConfig";
import {
  DendronPreviewConfig,
  genDefaultPreviewConfig,
} from "./preview/preview";
import {
  DendronPublishingConfig,
  genDefaultPublishingConfig,
} from "./publishing/publishing";
import { DendronGlobalConfig, genDefaultGlobalConfig } from "./global/global";
import { DendronDevConfig, genDefaultDevConfig } from "./dev/DendronDevConfig";

/**
 * DendronConfig
 * This is the top level config that will hold everything.
 */
export type DendronConfig = {
  version?: number;
  global: DendronGlobalConfig;
  commands: DendronCommandConfig;
  workspace: DendronWorkspaceConfig;
  preview: DendronPreviewConfig;
  publishing: DendronPublishingConfig;
  dev?: DendronDevConfig;
};

export type TopLevelDendronConfig = keyof DendronConfig;

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
