import { errAsync, okAsync } from "neverthrow";
import { DendronError } from "../error";
import { URI, Utils } from "vscode-uri";
import { ConfigReadOpts, IConfigStore } from "./IConfigStore";
import { IFileStore } from "./IFileStore";
import { CONSTANTS } from "../constants";
import { ConfigUtils, DeepPartial } from "../utils";
import { DendronConfig, DendronConfigValue } from "../types";
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
      .asyncAndThen((configDump) => this.writeToFS(this.path, configDump))
      .map(() => config);
  }

  readRaw() {
    return this.readFromFS(this.path)
      .andThen(YamlUtils.fromStr)
      .andThen(ConfigUtils.parsePartial);
  }

  read(opts?: ConfigReadOpts) {
    const { applyOverride } = _.defaults(opts, {
      applyOverride: false,
    });
    if (!applyOverride) {
      return this.readWithDefaults();
    } else {
      return this.searchOverride()
        .orElse(() => this.readWithDefaults())
        .andThen(ConfigUtils.validateLocalConfig)
        .andThen((override) =>
          this.readWithDefaults().map((config) =>
            ConfigUtils.mergeConfig(config, override)
          )
        );
    }
  }

  private readWithDefaults() {
    return this.readRaw().andThen((rawConfig) => {
      const cleanConfig = DConfigLegacy.configIsV4(rawConfig)
        ? DConfigLegacy.v4ToV5(rawConfig)
        : _.defaultsDeep(rawConfig, ConfigUtils.genDefaultConfig());
      return ConfigUtils.parse(cleanConfig);
    });
  }

  private readOverride(path: URI) {
    return this.readFromFS(path);
  }

  searchOverride() {
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
    return YamlUtils.toStr(payload)
      .asyncAndThen((endPayload) => this.writeToFS(this.path, endPayload))
      .map(() => payload);
  }

  private writeToFS(uri: URI, content: string) {
    return ResultUtils.PromiseRespV3ToResultAsync(
      this._fileStore.write(uri, content)
    );
  }

  private readFromFS(uri: URI) {
    return ResultUtils.PromiseRespV3ToResultAsync(this._fileStore.read(uri));
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
        return errAsync(new DendronError({ message: `${key} does not exist` }));
      }
      _.unset(config, key);
      return this.write(config).map(() => prevValue);
    });
  }
}
