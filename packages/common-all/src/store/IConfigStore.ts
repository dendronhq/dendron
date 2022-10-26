import { ResultAsync } from "neverthrow";
import { IDendronError } from "../error";
import { DendronConfig, DendronConfigValue } from "../types";
import { DeepPartial } from "../utils";

export type ConfigValue = string | number | object;

export type ConfigReadMode = "override" | "default";
export type ConfigReadOpts = {
  mode: ConfigReadMode;
  useCache?: boolean;
};

export type ConfigGetOpts = ConfigReadOpts;

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
  get(
    key: string,
    opts: ConfigGetOpts
  ): ResultAsync<DendronConfigValue, IDendronError>;
  /**
   * Given a dot delimited path, update the config entry value with given value in the persistant dendron config
   * returns previous value
   */
  update(
    key: string,
    value: DendronConfigValue
  ): ResultAsync<DendronConfigValue | undefined, IDendronError>;
  /**
   * Given a dot delimited path, delete the config entry in the persistant dendron config
   * returns previous value
   */
  delete(
    key: string
  ): ResultAsync<DendronConfigValue | undefined, IDendronError>;
}
