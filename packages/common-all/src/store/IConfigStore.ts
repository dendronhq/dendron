import { ResultAsync } from "neverthrow";
import { IDendronError } from "../error";
import { DendronConfig } from "../types";
import { DeepPartial } from "../utils";

export type ConfigValue = string | number | object;
export type BaseConfigEntryPayload = { value: ConfigValue };

export type ConfigEntryGetResult = {} & BaseConfigEntryPayload;
export type ConfigEntryUpdateResult = {
  prevValue: ConfigValue;
} & BaseConfigEntryPayload;
export type ConfigEntryDeleteResult = { prevValue: ConfigValue };

export type ConfigReadMode = "override" | "default";
export type ConfigReadOpts = {
  mode: ConfigReadMode;
  useCache?: boolean;
};

export interface IConfigStore {
  // entire config

  /**
   * Create a persistant dendron config
   * If a persistant dendron config exists, return an error
   */
  create(
    defaults?: DeepPartial<DendronConfig>
  ): ResultAsync<DendronConfig, IDendronError>;
  /**
   * Read the entire dendron config
   */
  readRaw(): ResultAsync<DeepPartial<DendronConfig>, IDendronError>;
  read(opts: ConfigReadOpts): ResultAsync<DendronConfig, IDendronError>;
  /**
   * Given a dendron config, update the persistant dendron config with the given payload
   */
  write(payload: DendronConfig): ResultAsync<DendronConfig, IDendronError>;

  // individual keys
  /**
   * Given a dot delimited path, retrieve the config entry value in the persistant dendron config
   */
  // get(key: string): ResultAsync<ConfigEntryGetResult, IDendronError>;
  /**
   * Given a dot delimited path, update the config entry value with given value in the persistant dendron config
   */
  // update(
  //   key: string,
  //   value: ConfigValue
  // ): ResultAsync<ConfigEntryUpdateResult, IDendronError>;
  /**
   * Given a dot delimited path, delete the config entry in the persistant dendron config
   */
  // delete(key: string): ResultAsync<ConfigEntryDeleteResult, IDendronError>;
}
