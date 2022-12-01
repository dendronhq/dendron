import _ from "lodash";
import { URI } from "vscode-uri";
import { ConfigStore, IFileStore } from "../store";
import { errAsync, okAsync } from "neverthrow";
import { DendronConfig, DendronConfigValue, DVault } from "../types";
import { ConfigUtils, DeepPartial } from "../utils";
import { DendronError } from "../error";
import * as YamlUtils from "../yaml";
import { DConfigLegacy } from "../oneoff/ConfigCompat";

export type ConfigServiceOpts = {
  // the home directory.
  // do not pass in home directory if the file store implementation has no concept of home directory.
  // i.e. only pass it in for NodeJSFileStore
  homeDir: URI | undefined;
  fileStore: IFileStore;
};

export class ConfigService {
  static _singleton: undefined | ConfigService;
  public homeDir;
  private _configStore: ConfigStore;
  private _fileStore: IFileStore;

  configPath(wsRoot: URI): URI {
    return this._configStore.configPath(wsRoot);
  }

  configOverridePath(wsRoot: URI, scope: "workspace" | "global") {
    return this._configStore.configOverridePath(wsRoot, scope);
  }

  /** static */

  static instance(opts?: ConfigServiceOpts) {
    if (_.isUndefined(this._singleton)) {
      if (ConfigService.isConfigServiceOpts(opts)) {
        this._singleton = new ConfigService(opts);
      } else {
        throw new DendronError({
          message: "Unable to retrieve or create config service instance.",
        });
      }
    }
    return this._singleton;
  }

  static isConfigServiceOpts(
    opts?: ConfigServiceOpts
  ): opts is ConfigServiceOpts {
    if (opts === undefined) return false;
    if (opts.fileStore === undefined) return false;
    return true;
  }

  constructor(opts: ConfigServiceOpts) {
    this.homeDir = opts.homeDir;
    this._fileStore = opts.fileStore;
    this._configStore = new ConfigStore(this._fileStore, this.homeDir);
  }

  /** public */

  /**
   * Given defaults to use, apply defaults and create `dendron.yml`
   * @param defaults partial DendronConfig that holds desired default values
   * @returns created config
   */
  createConfig(wsRoot: URI, defaults?: DeepPartial<DendronConfig>) {
    return this._configStore.createConfig(wsRoot, defaults);
  }

  /**
   * read config from dendron.yml without any modifications
   * @returns Partial<DendronConfig>
   */
  readRaw(wsRoot: URI) {
    return this._configStore.readConfig(wsRoot);
  }

  /**
   * read config from dendron.yml
   * @param opts applyOverride?
   * @returns DendronConfig
   */
  readConfig(
    wsRoot: URI,
    opts?: {
      applyOverride?: boolean;
    }
  ) {
    const { applyOverride } = _.defaults(opts, { applyOverride: true });
    if (!applyOverride) {
      return this.readWithDefaults(wsRoot);
    } else {
      return this.readWithOverrides(wsRoot);
    }
  }

  /**
   * Given a payload, clean up override content if exists, and write to dendron.yml
   * @param payload DendronConfig
   * @returns cleaned DendronConfig that was written
   */
  writeConfig(wsRoot: URI, payload: DendronConfig) {
    return this.cleanWritePayload(wsRoot, payload).andThen((payload) => {
      return this._configStore.writeConfig(wsRoot, payload);
    });
  }

  /**
   * Given a key, get the value of key
   * @param key key of DendronConfig
   * @param opts applyOverride?
   * @returns value of key
   */
  getConfig(
    wsRoot: URI,
    key: string,
    opts?: {
      applyOverride?: boolean;
    }
  ) {
    return this.readConfig(wsRoot, opts).map((config) => _.get(config, key));
  }

  /**
   * Given an key and value, update the value of key with given value
   * key is an object path (e.g. `commands.lookup.note.leaveTrace`)
   *
   * note: this currently does not do validation for the resulting config object.
   *
   * @param key key of DendronConfig
   * @param value value to use for update of key
   * @returns value of key before update
   */
  updateConfig(wsRoot: URI, key: string, value: DendronConfigValue) {
    return this.readConfig(wsRoot).andThen((config) => {
      const prevValue = _.get(config, key);
      const updatedConfig = _.set(config, key, value);
      return this.writeConfig(wsRoot, updatedConfig).map(() => prevValue);
    });
  }

  /**
   * Given a key, unset the key from config object
   * key is an object path (e.g. `commands.lookup.note.leaveTrace`)
   * @param key key of DendronConfig
   * @returns value of key before deletion
   */
  deleteConfig(wsRoot: URI, key: string) {
    return this.readConfig(wsRoot).andThen((config) => {
      const prevValue = _.get(config, key);
      if (prevValue === undefined) {
        return errAsync(new DendronError({ message: `${key} does not exist` }));
      }
      _.unset(config, key);
      return this.writeConfig(wsRoot, config).map(() => prevValue);
    });
  }

  writeOverride(
    wsRoot: URI,
    config: DeepPartial<DendronConfig>,
    mode: "workspace" | "global"
  ) {
    return this._configStore.writeOverride(wsRoot, config, mode);
  }

  /** helpers */

  /**
   * Read raw config and apply defaults.
   * If raw config is v4, convert to v5 config before applying defaults
   * @returns DendronConfig
   */
  private readWithDefaults(wsRoot: URI) {
    return this.readRaw(wsRoot).andThen((rawConfig) => {
      const cleanConfig = DConfigLegacy.configIsV4(rawConfig)
        ? DConfigLegacy.v4ToV5(rawConfig)
        : _.defaultsDeep(rawConfig, ConfigUtils.genDefaultConfig());
      return ConfigUtils.parse(cleanConfig);
    });
  }

  /**
   * Read raw config, apply defaults, and merge override content.
   * if override isn't found, identical to {@link ConfigService.readWithDefaults}
   * @returns DendronConfig
   */
  private readWithOverrides(wsRoot: URI) {
    return this.searchOverride(wsRoot)
      .andThen((override) => {
        return this.readWithDefaults(wsRoot).map((config) => {
          return ConfigUtils.mergeConfig(config, override);
        });
      })
      .orElse(() => {
        return this.readWithDefaults(wsRoot);
      });
  }

  /**
   * Given a write payload,
   * if override is found, filter out the configs present in override
   * otherwise, pass through
   * @param payload write payload
   * @returns cleaned payload
   */
  private cleanWritePayload(wsRoot: URI, payload: DendronConfig) {
    return this.searchOverride(wsRoot)
      .andThen((overrideConfig) => {
        return this.excludeOverrideVaults(payload, overrideConfig);
      })
      .orElse(() => okAsync(payload));
  }

  /**
   * Search for override config from both workspace or home directory.
   * workspace override config takes precedence.
   * @returns override config
   */
  searchOverride(wsRoot: URI) {
    return this._configStore
      .readOverride(wsRoot, "workspace")
      .orElse(() => {
        return this._configStore
          .readOverride(wsRoot, "global")
          .orElse(() => okAsync(""));
      })
      .andThen(YamlUtils.fromStr)
      .andThen(ConfigUtils.parsePartial)
      .andThen(ConfigUtils.validateLocalConfig);
  }

  /**
   * Given a config and an override config,
   * return the difference (config - override)
   *
   * Note that this is currently only used to filter out `workspace.vaults`
   * @param payload original payload
   * @param override override payload
   * @returns
   */
  private excludeOverrideVaults(
    payload: DendronConfig,
    override: DeepPartial<DendronConfig>
  ) {
    const vaultsFromOverride = override.workspace?.vaults as DVault[];
    const payloadDifference: DendronConfig = {
      ...payload,
      workspace: {
        ...payload.workspace,
        vaults: _.differenceWith(
          payload.workspace.vaults,
          vaultsFromOverride,
          _.isEqual
        ),
      },
    };
    return okAsync(payloadDifference);
  }
}
