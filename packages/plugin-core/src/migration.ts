import {
  DendronConfig,
  WorkspaceOpts,
} from "@dendronhq/api-server/node_modules/@dendronhq/common-all/src";
import { DendronError } from "@dendronhq/common-all";
import { createNormVault, DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import { Logger } from "./logger";
import { DendronWorkspace } from "./workspace";

export function migrateConfig({
  config,
  wsRoot,
}: { config: DendronConfig } & Omit<WorkspaceOpts, "vaults">) {
  const ctx = "migrateConfig";
  let changed = false;
  if (_.isEmpty(config.vaults)) {
    Logger.info({ ctx, msg: "config.vaults empty" });
    const wsFolders = DendronWorkspace.workspaceFolders();
    if (_.isUndefined(wsFolders)) {
      throw new DendronError({ msg: "no vaults detected" });
    }
    const { vault } = createNormVault({
      wsRoot,
      vault: { fsPath: wsFolders[0].uri.fsPath },
    });
    config.vaults = [vault];
    changed = true;
  }
  if (_.isUndefined(config.version)) {
    config.version = 0;
    changed = true;
  }

  if (changed) {
    DConfig.writeConfig({ wsRoot, config });
  }
  return changed;
}
