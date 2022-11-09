import _ from "lodash";
import { URI } from "vscode-uri";
import { ConfigReadOpts, ConfigStore, IFileStore } from "../store";
import { okAsync } from "neverthrow";
import { DendronConfig, DendronConfigValue, DVault } from "../types";
import { DeepPartial } from "../utils";
import { DendronError } from "../error";

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

  get path(): URI {
    return this._configStore.path;
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
    return this._configStore.readRaw();
  }

  read(opts?: ConfigReadOpts) {
    return this._configStore.read(opts);
  }

  write(payload: DendronConfig) {
    return this.cleanWritePayload(payload).andThen(this._configStore.write);
  }

  get(key: string, opts?: ConfigReadOpts) {
    return this._configStore.get(key, opts);
  }

  update(key: string, value: DendronConfigValue) {
    return this._configStore.update(key, value);
  }

  delete(key: string) {
    return this._configStore.delete(key);
  }

  /** helpers */

  /**
   * Given a write payload,
   * if override is found, filter out the configs present in override
   * otherwise, pass through
   * @param payload write payload
   * @returns cleaned payload
   */
  private cleanWritePayload(payload: DendronConfig) {
    return this._configStore
      .searchOverride()
      .andThen((overrideConfig) => {
        return this.excludeOverrideVaults(payload, overrideConfig);
      })
      .orElse(() => okAsync(payload));
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
