import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { DendronError, IDendronError } from "../error";
import { URI, Utils } from "vscode-uri";
import { ConfigReadOpts, IConfigStore } from "./IConfigStore";
import { IFileStore } from "./IFileStore";
import { CONSTANTS, StatusCodes } from "../constants";
import { ConfigUtils, DeepPartial } from "../utils";
import { DendronConfig, DendronConfigValue, DVault } from "../types";
import * as YamlUtils from "../yaml";
import { DConfigLegacy } from "../oneoff/ConfigCompat";
import _, { over } from "lodash";
import { ResultUtils } from "../ResultUtils";

export class ConfigStore implements IConfigStore {
  private _fileStore: IFileStore;
  private _wsRoot: URI;
  private _cachedDendronConfig: DendronConfig | undefined;
  private _homeDir: URI | undefined;

  get path(): URI {
    return Utils.joinPath(this._wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  constructor(fileStore: IFileStore, wsRoot: URI, homeDir: URI | undefined) {
    this._fileStore = fileStore;
    this._wsRoot = wsRoot;
    this._homeDir = homeDir;
  }

  createConfig(
    defaults?: DeepPartial<DendronConfig>
  ): ResultAsync<DendronConfig, IDendronError> {
    const config: DendronConfig = ConfigUtils.genLatestConfig(defaults);

    return YamlUtils.toStr(config)
      .asyncAndThen((configDump) =>
        ResultUtils.PromiseRespV3ToResultAsync(
          this._fileStore.write(this.path, configDump)
        )
      )
      .map(() => config);
  }

  readRaw(): ResultAsync<DeepPartial<DendronConfig>, IDendronError> {
    const result = ResultUtils.PromiseRespV3ToResultAsync(
      this._fileStore.read(this.path)
    )
      .andThen(YamlUtils.fromStr)
      .andThen(ConfigUtils.parsePartial);
    return result;
  }

  read(
    opts: ConfigReadOpts
  ): ResultAsync<DendronConfig, IDendronError<StatusCodes | undefined>> {
    const { mode, useCache } = opts;
    if (mode === "default") {
      if (this._cachedDendronConfig && useCache) {
        return okAsync(this._cachedDendronConfig);
      }
      return this.readWithDefaults();
    } else {
      return this.searchOverride()
        .map((override) => {
          if (override.workspace) {
            if (
              _.isEmpty(override.workspace) ||
              (override.workspace.vaults &&
                !_.isArray(override.workspace.vaults))
            ) {
              return errAsync(
                new DendronError({
                  message:
                    "workspace must not be empty and vaults must be an array if workspace is set",
                })
              );
            }
          }
          return this.readWithDefaults().map((config) =>
            ConfigUtils.mergeConfig(config, override)
          );
        })
        .andThen((inner) => inner);
    }
  }

  private readWithDefaults() {
    return this.readRaw()
      .andThen((rawConfig) => {
        const cleanConfig = DConfigLegacy.configIsV4(rawConfig)
          ? DConfigLegacy.v4ToV5(rawConfig)
          : _.defaultsDeep(rawConfig, ConfigUtils.genDefaultConfig());
        return ConfigUtils.parse(cleanConfig);
      })
      .map((config) => {
        this._cachedDendronConfig = config;
        return config;
      });
  }

  private readOverride(path: URI) {
    return ResultUtils.PromiseRespV3ToResultAsync(
      this._fileStore.read(path)
    ).andThen(YamlUtils.fromStr);
  }

  private searchOverride(): ResultAsync<
    DeepPartial<DendronConfig>,
    IDendronError
  > {
    const workspaceOverridePath = Utils.joinPath(
      this._wsRoot,
      CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
    );

    return ResultAsync.fromPromise(
      Promise.resolve(
        this.readOverride(workspaceOverridePath).then((res) => {
          if (res.isOk()) {
            // override found in workspace.
            return res.value as DeepPartial<DendronConfig>;
          } else if (this._homeDir) {
            // try finding it globally
            const globalOverridePath = Utils.joinPath(
              this._homeDir,
              CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
            );
            return Promise.resolve(
              this.readOverride(globalOverridePath).then((res) => {
                if (res.isOk()) {
                  // found it in global
                  return res.value as DeepPartial<DendronConfig>;
                } else {
                  throw new DendronError({ message: "override not found" });
                }
              })
            );
          } else {
            throw new DendronError({ message: "override not found" });
          }
        })
      ),
      (err) => err as DendronError
    );
  }

  write(
    payload: DendronConfig
  ): ResultAsync<DendronConfig, IDendronError<StatusCodes | undefined>> {
    // TODO: once the store methods are mirrored to the engine,
    // move this filtering logic out of store implementation.

    // check if we have overrides and only write the difference
    const searchOverrideResult = this.searchOverride();

    return ResultAsync.fromPromise(
      Promise.resolve(
        searchOverrideResult.then((res) => {
          const payloadDumpResult = YamlUtils.toStr(payload);
          if (payloadDumpResult.isErr()) {
            throw payloadDumpResult.error;
          }

          if (res.isErr()) {
            return Promise.resolve(
              this._fileStore
                .write(this.path, payloadDumpResult.value)
                .then((resp) => {
                  if (resp.error) {
                    throw resp.error;
                  }
                  this._cachedDendronConfig = payload;
                  return payload;
                })
            );
          } else {
            // currently we only allow override of workspace.vaults
            // if we extend `dendronrc.yml` to accept arbitrary config keys,
            // we need to find the deep-difference here
            const vaultsFromOverride = res.value.workspace?.vaults as DVault[];
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

            const payloadDifferenceDumpResult =
              YamlUtils.toStr(payloadDifference);
            if (payloadDifferenceDumpResult.isErr()) {
              throw payloadDifferenceDumpResult.error;
            }

            return Promise.resolve(
              this._fileStore
                .write(this.path, payloadDifferenceDumpResult.value)
                .then((resp) => {
                  if (resp.error) {
                    throw resp.error;
                  }
                  this._cachedDendronConfig = payloadDifference;
                  return payloadDifference;
                })
            );
          }
        })
      ),
      (err) => err as DendronError
    );
  }

  get(
    key: string,
    opts: ConfigReadOpts
  ): ResultAsync<DendronConfigValue, IDendronError<StatusCodes | undefined>> {
    return this.read(opts).map((config) => _.get(config, key));
  }

  update(
    key: string,
    value: DendronConfigValue
  ): ResultAsync<DendronConfigValue, IDendronError<StatusCodes | undefined>> {
    return this.read({ mode: "default" })
      .map((config) => {
        const prevValue = _.get(config, key);
        const updatedConfig = _.set(config, key, value);
        return this.write(updatedConfig).map(() => prevValue);
      })
      .andThen((inner) => inner);
  }

  delete(
    key: string
  ): ResultAsync<DendronConfigValue, IDendronError<StatusCodes | undefined>> {
    return this.read({ mode: "default" })
      .map((config) => {
        const prevValue = _.get(config, key);
        if (prevValue === undefined) {
          return errAsync(
            new DendronError({ message: `${key} does not exist` })
          );
        }
        _.unset(config, key);
        return this.write(config).map(() => prevValue);
      })
      .andThen((inner) => inner);
  }
}
