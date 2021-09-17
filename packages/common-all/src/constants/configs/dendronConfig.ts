import { DendronConfigEntryCollection } from "../../types/configs/base";
import { DendronConfig } from "../../types/configs/dendronConfig";
import { GLOBAL } from "./global";
import { COMMANDS } from "./commands";
import { WORKSPACE } from "./workspace";
import { PREVIEW } from "./preview";
import { PUBLISHING } from "./publishing";
import { DEV } from "./dev";

export const DENDRON_CONFIG: DendronConfigEntryCollection<DendronConfig> = {
  global: GLOBAL,
  commands: COMMANDS,
  workspace: WORKSPACE,
  preview: PREVIEW,
  publishing: PUBLISHING,
  dev: DEV,
};
