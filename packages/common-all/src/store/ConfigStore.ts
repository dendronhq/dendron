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
  private _homeDir: URI | undefined;

  configPath(wsRoot: URI): URI {
    return Utils.joinPath(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  configOverridePath(wsRoot: URI, scope: "workspace" | "global") {
    const root = scope === "workspace" ? wsRoot : this._homeDir;
    if (root) {
      return Utils.joinPath(root, CONSTANTS.DENDRON_LOCAL_CONFIG_FILE);
    } else {
      return undefined;
    }
  }

  constructor(fileStore: IFileStore, homeDir: URI | undefined) {
    this._fileStore = fileStore;
    this._homeDir = homeDir;
  }

  createConfig(wsRoot: URI, defaults?: DeepPartial<DendronConfig>) {
    const config: DendronConfig = ConfigUtils.genLatestConfig(defaults);

    return YamlUtils.toStr(config)
      .asyncAndThen((configDump) =>
        this.writeToFS(this.configPath(wsRoot), configDump)
      )
      .map(() => config);
  }

  readConfig(wsRoot: URI) {
    return this.readFromFS(this.configPath(wsRoot))
      .andThen((str) => YamlUtils.fromStr(str, true))
      .andThen(ConfigUtils.parsePartial);
  }

  readOverride(wsRoot: URI, mode: "workspace" | "global") {
    const doRead = (path: URI) => {
      const readPath = Utils.joinPath(
        path,
        CONSTANTS.DENDRON_LOCAL_CONFIG_FILE
      );
      return this.readFromFS(readPath);
    };

    if (mode === "workspace") {
      return doRead(wsRoot);
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

  writeConfig(wsRoot: URI, payload: DendronConfig) {
    return YamlUtils.toStr(payload)
      .asyncAndThen((endPayload) =>
        this.writeToFS(this.configPath(wsRoot), endPayload)
      )
      .map(() => payload);
  }

  writeOverride(
    wsRoot: URI,
    config: DeepPartial<DendronConfig>,
    mode: "workspace" | "global"
  ) {
    return YamlUtils.toStr(config).asyncAndThen((content) => {
      const writePath = this.configOverridePath(wsRoot, mode);
      if (writePath) {
        return this.writeToFS(writePath, content);
      } else {
        return errAsync(
          new DendronError({
            message: "global override not supported with current file store.",
          })
        );
      }
    });
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
