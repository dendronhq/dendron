import {
  IntermediateDendronConfig,
  DendronError,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { Logger } from "./logger";
import { DendronExtension } from "./workspace";

/**
 * Migrate dendron.yml if necessary
 */
export function migrateConfig({
  config,
  wsRoot,
}: {
  config: IntermediateDendronConfig
} & Omit<WorkspaceOpts, "vaults">) {
  const ctx = "migrateConfig";
  let changed = false;
  // if no config, write it in
  if (_.isEmpty(config.vaults)) {
    Logger.info({ ctx, msg: "config.vaults empty" });
    const wsFolders = DendronExtension.workspaceFolders();
    if (_.isUndefined(wsFolders)) {
      throw new DendronError({ message: "no vaults detected"});
    }
    const vault = {
      fsPath: path.relative(wsRoot, wsFolders[0].uri.fsPath),
    };
    config.vaults = [vault];
    changed = true;
  }
  // if no version, write it in
  if (_.isUndefined(config.version)) {
    config.version = 0;
    changed = true;
  }

  // check if vaults are absolute path, if so, change
  config.vaults.forEach((ent) => {
    if (path.isAbsolute(ent.fsPath)) {
      ent.fsPath = path.relative(wsRoot, ent.fsPath);
      changed = true;
    }
  });

  if (changed) {
    DConfig.writeConfig({ wsRoot, config });
  }
  return changed;
}
