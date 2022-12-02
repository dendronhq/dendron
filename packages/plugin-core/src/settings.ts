import { pathForVaultRoot } from "@dendronhq/common-server";
import {
  CodeConfigChanges,
  ConfigChanges,
  ConfigUpdateChangeSet,
  Settings as EngineSettings,
  SettingsUpgradeOpts,
  Snippets,
  WorkspaceConfig as EngineWorkspaceConfig,
  Extensions as EngineExtension,
  _SETTINGS,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import {
  ConfigurationTarget,
  extensions,
  WorkspaceConfiguration,
} from "vscode";
import { CONFIG } from "./constants";
import { ExtensionProvider } from "./ExtensionProvider";
import { Logger } from "./logger";

export { Snippets };

export class Extensions extends EngineExtension {
  /**
   * Get Dendron recommended extensions
   */
  static getDendronExtensionRecommendations() {
    return _.filter(Extensions.configEntries(), (ent) => {
      return _.isUndefined(ent.action);
    }).map((ent) => {
      return {
        id: ent.default,
        extension: extensions.getExtension(ent.default),
      };
    });
  }
}

export class WorkspaceConfig extends EngineWorkspaceConfig {
  static async update(_wsRoot: string): Promise<Required<CodeConfigChanges>> {
    const ctx = "WorkspaceConfig:update";
    const src = ExtensionProvider.getWorkspaceConfig();
    const changes = await Settings.upgrade(src, _SETTINGS);
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    const vpath = pathForVaultRoot({ wsRoot, vault: vaults[0] });
    const vscodeDir = path.join(vpath, ".vscode");
    const snippetChanges = await Snippets.upgradeOrCreate(vscodeDir);
    Logger.info({ ctx, vscodeDir, snippetChanges });
    return {
      extensions: {},
      settings: changes,
      snippetChanges,
    };
  }
}

export class Settings extends EngineSettings {
  /**
   * Upgrade config
   * @param config config to upgrade
   * @param target: config set to upgrade to
   */
  static async upgrade(
    src: WorkspaceConfiguration,
    target: ConfigUpdateChangeSet,
    opts?: SettingsUpgradeOpts
  ): Promise<ConfigChanges> {
    const cleanOpts = _.defaults(opts, { force: false });
    const add: any = {};
    const errors: any = {};
    await Promise.all(
      _.map(
        _.omit(target, [
          "workbench.colorTheme",
          "[markdown]",
          CONFIG.DEFAULT_JOURNAL_DATE_FORMAT.key,
          CONFIG.DEFAULT_SCRATCH_DATE_FORMAT.key,
        ]),
        async (entry, key) => {
          const item = src.inspect(key);
          // if value for key is not defined anywhere, set it to the default
          if (
            _.every(
              [
                item?.globalValue,
                item?.workspaceFolderValue,
                item?.workspaceValue,
              ],
              _.isUndefined
            ) ||
            cleanOpts.force
          ) {
            const value = entry.default;
            try {
              src.update(key, value, ConfigurationTarget.Workspace);
              add[key] = value;
              return;
            } catch (err) {
              errors[key] = err;
            }
          }
          return;
        }
      )
    );
    return { add, errors };
  }
}
