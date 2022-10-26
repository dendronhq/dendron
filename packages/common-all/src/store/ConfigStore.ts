import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { DendronError, IDendronError } from "../error";
import { URI, Utils } from "vscode-uri";
import { ConfigReadOpts, IConfigStore } from "./IConfigStore";
import { IFileStore } from "./IFileStore";
import { CONSTANTS, StatusCodes } from "../constants";
import { ConfigUtils, DeepPartial } from "../utils";
import { DendronConfig } from "../types";
import { fromStr, toStr } from "../yaml";
import { DConfigLegacy } from "../oneoff/ConfigCompat";
import _ from "lodash";

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

  create(
    defaults?: DeepPartial<DendronConfig>
  ): ResultAsync<DendronConfig, IDendronError> {
    const config: DendronConfig = ConfigUtils.genLatestConfig(defaults);

    const configDumpResult = toStr(config);
    if (configDumpResult.isErr()) {
      return errAsync(configDumpResult.error);
    }

    const configDump = configDumpResult.value;
    return ResultAsync.fromPromise(
      Promise.resolve(
        this._fileStore.write(this.path, configDump).then((resp) => {
          // TODO: remove throws and chain result.
          // until IFileStore methods are changed to use neverthrow
          // instead of RespV3, we need to manually throw here
          // in order for this ResultAsync to properly handle it
          if (resp.error) {
            throw resp.error;
          }
          return config;
        })
      ),
      (err) => err as DendronError
    );
  }

  readRaw(): ResultAsync<
    DeepPartial<DendronConfig>,
    IDendronError<StatusCodes | undefined>
  > {
    return ResultAsync.fromPromise(
      Promise.resolve(
        this._fileStore.read(this.path).then((resp) => {
          // TODO: remove throws and chain result.
          // until IFileStore methods are changed to use neverthrow
          // instead of RespV3, we need to manually throw here
          // in order for this ResultAsync to properly handle it
          if (resp.error) {
            throw resp.error;
          }

          const readPayload = resp.data;

          const configLoadResult = fromStr(readPayload);
          if (configLoadResult.isErr()) {
            throw configLoadResult.error;
          }
          return configLoadResult.value as DeepPartial<DendronConfig>;
        })
      ),
      (err) => err as DendronError
    );
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
      const readResult = this.readWithDefaults();
      return readResult.andThen<
        DendronConfig,
        IDendronError<StatusCodes | undefined>
      >((config) => {
        return ResultAsync.fromPromise(
          Promise.resolve(
            this.searchOverride().then((res) => {
              // TODO: move validateConfig logic to common-all and add it here.
              if (res.isOk()) {
                const override = res.value;
                _.mergeWith(
                  config,
                  override,
                  (objValue: any, srcValue: any) => {
                    if (_.isArray(objValue)) {
                      return srcValue.concat(objValue);
                    }
                    return;
                  }
                );
                return config;
              } else {
                throw res.error;
              }
            })
          ),
          (err) => err as DendronError
        );
      });
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
    return this._fileStore.read(path).then((resp) => {
      if (resp.data) {
        const loadResult = fromStr(resp.data);
        if (loadResult.isErr()) {
          throw loadResult.error;
        }
        return loadResult.value as DeepPartial<DendronConfig>;
      } else {
        return undefined;
      }
    });
  }

  private searchOverride(): ResultAsync<
    DeepPartial<DendronConfig>,
    IDendronError<StatusCodes | undefined>
  > {
    const workspaceOverridePath = Utils.joinPath(
      this._wsRoot,
      CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
    );

    return ResultAsync.fromPromise(
      Promise.resolve(
        this.readOverride(workspaceOverridePath).then((override) => {
          if (override) {
            // override found in workspace.
            return override as DeepPartial<DendronConfig>;
          } else if (this._homeDir) {
            // try finding it globally
            const globalOverridePath = Utils.joinPath(
              this._homeDir,
              CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
            );
            return Promise.resolve(
              this.readOverride(globalOverridePath).then((override) => {
                if (override) {
                  // found it in global
                  return override as DeepPartial<DendronConfig>;
                } else {
                  throw new DendronError({ message: "not found" });
                }
              })
            );
          } else {
            throw new DendronError({ message: "not found" });
          }
        })
      ),
      (err) => err as DendronError
    );
  }

  write(
    payload: DendronConfig
  ): ResultAsync<DendronConfig, IDendronError<StatusCodes | undefined>> {
    const payloadDumpResult = toStr(payload);
    if (payloadDumpResult.isErr()) {
      return errAsync(payloadDumpResult.error);
    }

    return ResultAsync.fromPromise(
      Promise.resolve(
        this._fileStore
          .write(this.path, payloadDumpResult.value)
          .then((resp) => {
            if (resp.error) {
              throw resp.error;
            }
            return payload;
          })
      ),
      (err) => err as DendronError
    );
  }
}
