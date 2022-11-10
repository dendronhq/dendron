import { errAsync } from "neverthrow";
import { DendronError } from "../error";
import { URI, Utils } from "vscode-uri";
import { IConfigStore } from "./IConfigStore";
import { IFileStore } from "./IFileStore";
import { CONSTANTS } from "../constants";
import { ConfigUtils, DeepPartial } from "../utils";
import { DendronConfig } from "../types";
import * as YamlUtils from "../yaml";
import _ from "lodash";
import { ResultUtils } from "../ResultUtils";

export class ConfigStore implements IConfigStore {
  private _fileStore: IFileStore;
  private _wsRoot: URI;
  private _homeDir: URI | undefined;

  get configPath(): URI {
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
      .asyncAndThen((configDump) => this.writeToFS(this.configPath, configDump))
      .map(() => config);
  }

  readConfig() {
    return this.readFromFS(this.configPath)
      .andThen(YamlUtils.fromStr)
      .andThen(ConfigUtils.parsePartial);
  }

  readOverride(mode: "workspace" | "global") {
    const doRead = (path: URI) => {
      const readPath = Utils.joinPath(
        path,
        CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
      );
      return this.readFromFS(readPath);
    };

    if (mode === "workspace") {
      return doRead(this._wsRoot);
    } else if (this._homeDir) {
      return doRead(this._homeDir);
    } else {
      return errAsync(
        new DendronError({
          message: "global override not supported with current file store.",
        })
      );
    }
  }

  writeConfig(payload: DendronConfig) {
    return YamlUtils.toStr(payload)
      .asyncAndThen((endPayload) => this.writeToFS(this.configPath, endPayload))
      .map(() => payload);
  }

  /** helpers */

  private writeToFS(uri: URI, content: string) {
    return ResultUtils.PromiseRespV3ToResultAsync(
      this._fileStore.write(uri, content)
    );
  }

  private readFromFS(uri: URI) {
    return ResultUtils.PromiseRespV3ToResultAsync(this._fileStore.read(uri));
  }
}
