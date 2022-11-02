import { errAsync, okAsync, err } from "neverthrow";
import { other, notFound } from "../error";
import { URI, Utils } from "vscode-uri";
import { ConfigReadOpts, IConfigStore } from "./IConfigStore";
import { IFileStore } from "./IFileStore";
import { CONSTANTS } from "../constants";
import { ConfigUtils, DeepPartial } from "../utils";
import { DendronConfig, DendronConfigValue, DVault } from "../types";
import * as YamlUtils from "../yaml";
import { DConfigLegacy } from "../oneoff/ConfigCompat";
import _ from "lodash";
import { ResultUtils } from "../ResultUtils";

export class ConfigStore implements IConfigStore {
  private _fileStore: IFileStore;
  private _wsRoot: URI;
  private _homeDir: URI | undefined;

  get path(): URI {
    return Utils.joinPath(this._wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  constructor(fileStore: IFileStore, wsRoot: URI, homeDir: URI | undefined) {
    this._fileStore = fileStore;
    this._wsRoot = wsRoot;
    this._homeDir = homeDir;
  }

  createConfig(defaults?: DeepPartial<DendronConfig>) {
    const config: DendronConfig = ConfigUtils.genLatestConfig(defaults);

    return YamlUtils.toStr(config)
      .asyncAndThen((configDump) =>
        ResultUtils.PromiseRespV3ToResultAsync(
          this._fileStore.write(this.path, configDump)
        )
      )
      .map(() => {
        return config;
      });
  }

  readRaw() {
    return ResultUtils.PromiseRespV3ToResultAsync(
      this._fileStore.read(this.path)
    )
      .andThen(YamlUtils.fromStr)
      .andThen((x) =>
        ConfigUtils.parsePartial(x).orElse((error) =>
          err(other("parsePartial error", error))
        )
      );
  }

  read(opts?: ConfigReadOpts) {
    const { applyOverride } = _.defaults(opts, {
      applyOverride: false,
    });
    if (!applyOverride) {
      return this.readWithDefaults();
    } else {
      return this.searchOverride()
        .orElse(() => {
          return this.readWithDefaults();
        })
        .andThen((override) => {
          if (override.workspace) {
            if (
              _.isEmpty(override.workspace) ||
              (override.workspace.vaults &&
                !_.isArray(override.workspace.vaults))
            ) {
              return errAsync(
                notFound(
                  "workspace must not be empty and vaults must be an array if workspace is set"
                )
              );
            }
          }
          return this.readWithDefaults().map((config) => {
            return ConfigUtils.mergeConfig(config, override);
          });
        });
    }
  }

  private readWithDefaults() {
    return this.readRaw().andThen((rawConfig) => {
      const cleanConfig = DConfigLegacy.configIsV4(rawConfig)
        ? DConfigLegacy.v4ToV5(rawConfig)
        : _.defaultsDeep(rawConfig, ConfigUtils.genDefaultConfig());
      return ConfigUtils.parse(cleanConfig).orElse((error) =>
        err(other("parsePartial error", error))
      );
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
      .andThen(ConfigUtils.parsePartial);
  }

  write(payload: DendronConfig) {
    // TODO: once the store methods are mirrored to the engine,
    // move this filtering logic out of store implementation.
    const processedPayload = this.searchOverride()
      .andThen((overrideConfig) => {
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
        return okAsync(payloadDifference);
      })
      .orElse(() => {
        return okAsync(payload);
      });

    return processedPayload.andThen((payload) => {
      return YamlUtils.toStr(payload)
        .asyncAndThen((endPayload) => {
          return ResultUtils.PromiseRespV3ToResultAsync(
            this._fileStore.write(this.path, endPayload)
          );
        })
        .map(() => {
          return payload;
        });
    });
  }

  get(key: string, opts?: ConfigReadOpts) {
    return this.read(opts).map((config) => _.get(config, key));
  }

  update(key: string, value: DendronConfigValue) {
    return this.read().andThen((config) => {
      const prevValue = _.get(config, key);
      const updatedConfig = _.set(config, key, value);
      return this.write(updatedConfig).map(() => prevValue);
    });
  }

  delete(key: string) {
    return this.read().andThen((config) => {
      const prevValue = _.get(config, key);
      if (prevValue === undefined) {
        return errAsync(notFound(`${key} does not exist`));
      }
      _.unset(config, key);
      return this.write(config).map(() => prevValue);
    });
  }
}
