import { ResultAsync } from "neverthrow";
import { URI } from "vscode-uri";
import { IDendronError } from "../error";
import { DendronConfig } from "../types";
import { DeepPartial } from "../utils";

export type ConfigValue = string | number | object;

export interface IConfigStore {
  /**
   * Create a persistent dendron config
   * If a persistent dendron config exists, return an error
   */
  createConfig(
    wsRoot: URI,
    defaults?: DeepPartial<DendronConfig>
  ): ResultAsync<DendronConfig, IDendronError>;

  /**
   * Read the entire dendron config as is
   */
  readConfig(
    wsRoot: URI
  ): ResultAsync<DeepPartial<DendronConfig>, IDendronError>;

  /**
   * Given a dendron config, update the persistent dendron config with the given payload
   * If dendronrc.yml is found, content that is present in dendronrc.yml will be filtered out before writing
   */
  writeConfig(
    wsRoot: URI,
    payload: DendronConfig
  ): ResultAsync<DendronConfig, IDendronError>;

  /**
   * Given mode (workspace or global), read override config
   */
  readOverride(
    wsRoot: URI,
    mode: "workspace" | "global"
  ): ResultAsync<string, IDendronError>;
}
