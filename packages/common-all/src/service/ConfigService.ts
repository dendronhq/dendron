import _ from "lodash";
import { URI } from "vscode-uri";
import { ConfigReadOpts, ConfigStore, IFileStore } from "../store";
import { errAsync, okAsync } from "neverthrow";
import { DendronConfig, DendronConfigValue, DVault } from "../types";
import { ConfigUtils, DeepPartial } from "../utils";
import { DendronError } from "../error";
import * as YamlUtils from "../yaml";
import { DConfigLegacy } from "../oneoff/ConfigCompat";

export type ConfigServiceOpts = {
  wsRoot: URI;
  // the home directory.
  // do not pass in home directory if the file store implementation has no concept of home directory.
  // i.e. only pass it in for NodeJSFileStore
  homeDir: URI | undefined;
  fileStore: IFileStore;
};

export class ConfigService {
  static _singleton: undefined | ConfigService;
  public wsRoot;
  public homeDir;
  private _configStore: ConfigStore;
  private _fileStore: IFileStore;

  get configPath(): URI {
    return this._configStore.configPath;
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
    if (opts.wsRoot === undefined || opts.fileStore === undefined) return false;
    return true;
  }

  constructor(opts: ConfigServiceOpts) {
    this.wsRoot = opts.wsRoot;
    this.homeDir = opts.homeDir;
    this._fileStore = opts.fileStore;
    this._configStore = new ConfigStore(
      this._fileStore,
      this.wsRoot,
      this.homeDir
    );
  }

  /** public */

  createConfig(defaults?: DeepPartial<DendronConfig>) {
    return this._configStore.createConfig(defaults);
  }

  readRaw() {
    return this._configStore.readConfig();
  }

  readConfig(opts?: ConfigReadOpts) {
    const { applyOverride } = _.defaults(opts, { applyOverride: false });
    if (!applyOverride) {
      return this.readWithDefaults();
    } else {
      return this.readWithOverrides();
    }
  }

  writeConfig(payload: DendronConfig) {
    return this.cleanWritePayload(payload).andThen(
      this._configStore.writeConfig
    );
  }

  get(key: string, opts?: ConfigReadOpts) {
    return this.readConfig(opts).map((config) => _.get(config, key));
  }

  update(key: string, value: DendronConfigValue) {
    return this.readConfig().andThen((config) => {
      const prevValue = _.get(config, key);
      const updatedConfig = _.set(config, key, value);
      return this.writeConfig(updatedConfig).map(() => prevValue);
    });
  }

  delete(key: string) {
    return this.readConfig().andThen((config) => {
      const prevValue = _.get(config, key);
      if (prevValue === undefined) {
        return errAsync(new DendronError({ message: `${key} does not exist` }));
      }
      _.unset(config, key);
      return this.writeConfig(config).map(() => prevValue);
    });
  }

  /** helpers */

  private readWithDefaults() {
    return this.readRaw().andThen((rawConfig) => {
      const cleanConfig = DConfigLegacy.configIsV4(rawConfig)
        ? DConfigLegacy.v4ToV5(rawConfig)
        : _.defaultsDeep(rawConfig, ConfigUtils.genDefaultConfig());
      return ConfigUtils.parse(cleanConfig);
    });
  }

  private readWithOverrides() {
    return this.searchOverride()
      .orElse(() => this.readWithDefaults())
      .andThen(ConfigUtils.validateLocalConfig)
      .andThen((override) =>
        this.readWithDefaults().map((config) =>
          ConfigUtils.mergeConfig(config, override)
        )
      );
  }

  /**
   * Given a write payload,
   * if override is found, filter out the configs present in override
   * otherwise, pass through
   * @param payload write payload
   * @returns cleaned payload
   */
  private cleanWritePayload(payload: DendronConfig) {
    return this.searchOverride()
      .andThen((overrideConfig) => {
        return this.excludeOverrideVaults(payload, overrideConfig);
      })
      .orElse(() => okAsync(payload));
  }

  private searchOverride() {
    return this._configStore
      .readOverride("workspace")
      .orElse(() => {
        return this._configStore
          .readOverride("global")
          .orElse(() => okAsync(""));
      })
      .andThen(YamlUtils.fromStr)
      .andThen(ConfigUtils.parsePartial);
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
