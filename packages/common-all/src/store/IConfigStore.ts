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

export interface IConfigStore {
  // entire config

  /**
   * Create a persistent dendron config
   * If a persistent dendron config exists, return an error
   */
  createConfig(
    defaults?: DeepPartial<DendronConfig>
  ): ResultAsync<DendronConfig, IDendronError>;
  /**
   * Read the entire dendron config
   */
  readRaw(): ResultAsync<DeepPartial<DendronConfig>, IDendronError>;
  read(opts: ConfigReadOpts): ResultAsync<DendronConfig, IDendronError>;
  /**
   * Given a dendron config, update the persistent dendron config with the given payload
   */
  write(payload: DendronConfig): ResultAsync<DendronConfig, IDendronError>;

  // individual keys
  /**
   * Given a property path, retrieve the config entry value in the persistent dendron config
   * e.g.) get("commands.lookup.note") will get the note lookup config object
   */
  get(
    key: string,
    opts: ConfigReadOpts
  ): ResultAsync<DendronConfigValue, IDendronError>;
  /**
   * Given a property path, update the config entry value with given value in the persistent dendron config
   * e.g.) update("commands.lookup.note.fuzzThreshold", 1) will update the fuzzThreshold to 1
   * returns previous value
   */
  update(
    key: string,
    value: DendronConfigValue
  ): ResultAsync<DendronConfigValue, IDendronError>;
  /**
   * Given a property path, delete the config entry in the persistent dendron config
   * e.g.) delete("commands.lookup.note.fuzzThreshold") will unset the property fuzzThreshold
   * returns previous value
   */
  delete(key: string): ResultAsync<DendronConfigValue, IDendronError>;
}
