import { ResultAsync } from "neverthrow";
import { IDendronError } from "../error";
import { DendronConfig } from "../types";
import { DeepPartial } from "../utils";

export type ConfigValue = string | number | object;

export type ConfigReadOpts = {
  applyOverride?: boolean;
};

export interface IConfigStore {
  /**
   * Create a persistent dendron config
   * If a persistent dendron config exists, return an error
   */
  createConfig(
    defaults?: DeepPartial<DendronConfig>
  ): ResultAsync<DendronConfig, IDendronError>;

  /**
   * Read the entire dendron config as is
   */
  readConfig(): ResultAsync<DeepPartial<DendronConfig>, IDendronError>;

  /**
   * Given a dendron config, update the persistent dendron config with the given payload
   * If dendronrc.yml is found, content that is present in dendronrc.yml will be filtered out before writing
   */
  writeConfig(
    payload: DendronConfig
  ): ResultAsync<DendronConfig, IDendronError>;

  /**
   * Given mode (workspace or global), read override config
   */
  readOverride(
    mode: "workspace" | "global"
  ): ResultAsync<string, IDendronError>;
}
