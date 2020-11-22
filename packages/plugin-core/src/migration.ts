import {
  DendronConfig,
  DendronError,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { writeJSONWithComments } from "@dendronhq/common-server";
import { createNormVault, DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import { Logger } from "./logger";
import { WorkspaceSettings } from "./types";
import { DendronWorkspace } from "./workspace";

export function migrateSettings({ settings }: { settings: WorkspaceSettings }) {
  const mdNotes = _.find(
    settings?.extensions?.recommendations,
    (ent) => ent === "dendron.dendron-markdown-notes"
  );
  let changed = false;
  if (mdNotes) {
    const recommendations = _.reject(
      settings?.extensions?.recommendations,
      (ent) => ent === "dendron.dendron-markdown-notes"
    );
    settings.extensions.recommendations = recommendations;
    // settings = assignJSONWithComment(extensions, settings)
    writeJSONWithComments(DendronWorkspace.workspaceFile().fsPath, settings);
    changed = true;
  }
  return { changed, settings };
}

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
