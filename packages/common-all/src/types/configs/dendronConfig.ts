import {
  DendronCommandConfig,
  genDefaultCommandConfig,
} from "./commands/commands";
import {
  DendronWorkspaceConfig,
  genDefaultWorkspaceConfig,
} from "./workspace/workspace";

export type DendronConfig = {
  command: DendronCommandConfig;
  workspace: DendronWorkspaceConfig;
  // publish: DendronPublishConfig;
  // preview: DendronPreviewConfig;
};

export function genDefaultDendronConfig(): DendronConfig {
  return {
    command: genDefaultCommandConfig(),
    workspace: genDefaultWorkspaceConfig(),
  };
}
