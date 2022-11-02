import { ResultAsync } from "neverthrow";
import { DendronErrorExperimental } from "../error";
import { DendronConfig, DendronConfigValue } from "../types";
import { DeepPartial } from "../utils";

export type ConfigValue = string | number | object;

export type ConfigReadOpts = {
  applyOverride?: boolean;
};

export interface IConfigStore {
  // entire config

  /**
   * Create a persistent dendron config
   * If a persistent dendron config exists, return an error
   */
  createConfig(
    defaults?: DeepPartial<DendronConfig>
  ): ResultAsync<DendronConfig, DendronErrorExperimental>;
  /**
   * Read the entire dendron config
   */
  readRaw(): ResultAsync<DeepPartial<DendronConfig>, DendronErrorExperimental>;
  read(
    opts?: ConfigReadOpts
  ): ResultAsync<DendronConfig, DendronErrorExperimental>;
  /**
   * Given a dendron config, update the persistent dendron config with the given payload
   */
  write(
    payload: DendronConfig
  ): ResultAsync<DendronConfig, DendronErrorExperimental>;

  // individual keys
  /**
   * Given a property path, retrieve the config entry value in the persistent dendron config
   * e.g.) get("commands.lookup.note") will get the note lookup config object
   */
  get(
    key: string,
    opts?: ConfigReadOpts
  ): ResultAsync<DendronConfigValue, DendronErrorExperimental>;
  /**
   * Given a property path, update the config entry value with given value in the persistent dendron config
   * e.g.) update("commands.lookup.note.fuzzThreshold", 1) will update the fuzzThreshold to 1
   * returns previous value
   */
  update(
    key: string,
    value: DendronConfigValue
  ): ResultAsync<DendronConfigValue, DendronErrorExperimental>;
  /**
   * Given a property path, delete the config entry in the persistent dendron config
   * e.g.) delete("commands.lookup.note.fuzzThreshold") will unset the property fuzzThreshold
   * returns previous value
   */
  delete(
    key: string
  ): ResultAsync<DendronConfigValue, DendronErrorExperimental>;
}
