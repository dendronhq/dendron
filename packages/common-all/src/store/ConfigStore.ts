import { errAsync, fromPromise, okAsync, err, ok, Result } from "neverthrow";
import { DendronError, IDendronError } from "../error";
import { URI, Utils } from "vscode-uri";
import { ConfigReadOpts, IConfigStore } from "./IConfigStore";
import { IFileStore } from "./IFileStore";
import { CONSTANTS, StatusCodes } from "../constants";
import { ConfigUtils, DeepPartial } from "../utils";
import { DendronConfig, DendronConfigValue, DVault } from "../types";
import * as YamlUtils from "../yaml";
import { DConfigLegacy } from "../oneoff/ConfigCompat";
import _ from "lodash";
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

  async createConfig(
    defaults?: DeepPartial<DendronConfig>
  ): Promise<Result<DendronConfig, IDendronError>> {
    const config: DendronConfig = ConfigUtils.genLatestConfig(defaults);

    return YamlUtils.toStr(config)
      .asyncAndThen((configDump) =>
        ResultUtils.PromiseRespV3ToResultAsync(
          this._fileStore.write(this.path, configDump)
        )
      )
      .map(() => {
        this._cachedDendronConfig = config;
        return config;
      });
  }

  async readRaw(): Promise<Result<DeepPartial<DendronConfig>, IDendronError>> {
    const result = ResultUtils.PromiseRespV3ToResultAsync(
      this._fileStore.read(this.path)
    )
      .andThen(YamlUtils.fromStr)
      .andThen(ConfigUtils.parsePartial);
    return result;
  }

  async read(
    opts: ConfigReadOpts
  ): Promise<Result<DendronConfig, IDendronError<StatusCodes | undefined>>> {
    const { mode, useCache } = opts;
    if (mode === "default") {
      if (this._cachedDendronConfig && useCache) {
        return okAsync(this._cachedDendronConfig);
      }
      return this.readWithDefaults();
    } else {
      const searchOverrideResult = await this.searchOverride();
      if (searchOverrideResult.isErr()) {
        // no override found.
        return this.readWithDefaults();
      }

      const override = searchOverrideResult.value;

      // validate override
      if (override.workspace) {
        if (
          _.isEmpty(override.workspace) ||
          (override.workspace.vaults && !_.isArray(override.workspace.vaults))
        ) {
          return err(
            new DendronError({
              message:
                "workspace must not be empty and vaults must be an array if workspace is set",
            })
          );
        }
      }

      // read config and merge with override
      const readResult = await this.readWithDefaults();
      if (readResult.isErr()) {
        return err(readResult.error);
      }
      const mergedConfig = ConfigUtils.mergeConfig(readResult.value, override);
      return ok(mergedConfig);
    }
  }

  private async readWithDefaults() {
    const readRawResult = await this.readRaw();
    return readRawResult
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
    return ResultUtils.PromiseRespV3ToResultAsync(this._fileStore.read(path));
  }

  private searchOverride() {
    const workspaceOverridePath = Utils.joinPath(
      this._wsRoot,
      CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
    );

    return this.readOverride(workspaceOverridePath)
      .orElse(() => {
        if (this._homeDir) {
          // try finding it globally
          const globalOverridePath = Utils.joinPath(
            this._homeDir,
            CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
          );
          return this.readOverride(globalOverridePath).orElse(() =>
            okAsync("")
          );
        } else {
          return okAsync("");
        }
      })
      .andThen(YamlUtils.fromStr)
      .map((overrideConfig) => {
        // TODO ideally we would parse incoming data
        return overrideConfig as DeepPartial<DendronConfig>;
      });
  }

  write(payload: DendronConfig) {
    // TODO: once the store methods are mirrored to the engine,
    // move this filtering logic out of store implementation.

    return this.searchOverride().andThen((overrideConfig) => {
      const vaultsFromOverride = overrideConfig.workspace?.vaults as DVault[];
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
      return YamlUtils.toStr(payloadDifference).asyncAndThen((endPayload) => {
        return ResultUtils.PromiseRespV3ToResultAsync(
          this._fileStore.write(this.path, endPayload)
        ).map(() => {
          this._cachedDendronConfig = payloadDifference;
          return payloadDifference;
        });
      });
    });
  }

  async get(
    key: string,
    opts: ConfigReadOpts
  ): Promise<
    Result<DendronConfigValue, IDendronError<StatusCodes | undefined>>
  > {
    const readResult = await this.read(opts);
    return readResult.map((config) => _.get(config, key));
  }

  async update(
    key: string,
    value: DendronConfigValue
  ): Promise<
    Result<DendronConfigValue, IDendronError<StatusCodes | undefined>>
  > {
    const readResult = await this.read({ mode: "default" });
    if (readResult.isErr()) {
      return err(readResult.error);
    }

    const config = readResult.value;
    const prevValue = _.get(config, key);
    const updatedConfig = _.set(config, key, value);
    const writeResult = await this.write(updatedConfig);
    return writeResult.map(() => prevValue);
  }

  async delete(
    key: string
  ): Promise<
    Result<DendronConfigValue, IDendronError<StatusCodes | undefined>>
  > {
    const readResult = await this.read({ mode: "default" });
    if (readResult.isErr()) {
      return err(readResult.error);
    }

    const config = readResult.value;
    const prevValue = _.get(config, key);
    if (prevValue === undefined) {
      return err(new DendronError({ message: `${key} does not exist` }));
    }

    _.unset(config, key);
    const writeResult = await this.write(config);
    return writeResult.map(() => prevValue);
  }
}
