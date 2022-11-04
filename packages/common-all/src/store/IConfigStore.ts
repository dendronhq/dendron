import { ResultAsync } from "neverthrow";
import { IDendronError } from "../error";
import { DendronConfig, DendronConfigValue } from "../types";
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
  readRaw(): ResultAsync<DeepPartial<DendronConfig>, IDendronError>;

  /**
   * Read the entire dendron config with defaults filled.
   * If opts.applyOverride, attempt to look for dendronrc.yml and merge it with the read content of dendron.yml
   */
  read(opts?: ConfigReadOpts): ResultAsync<DendronConfig, IDendronError>;

  /**
   * Given a dendron config, update the persistent dendron config with the given payload
   * If dendronrc.yml is found, content that is present in dendronrc.yml will be filtered out before writing
   */
  write(payload: DendronConfig): ResultAsync<DendronConfig, IDendronError>;

  /**
   * Given a property path, retrieve the config entry value in the persistent dendron config
   * e.g.) get("commands.lookup.note") will get the note lookup config object
   */
  get(
    key: string,
    opts?: ConfigReadOpts
  ): ResultAsync<DendronConfigValue, IDendronError>;

  /**
   * Given a property path, update the config entry value with given value in the persistent dendron config
   * e.g.) update("commands.lookup.note.fuzzThreshold", 1) will update the fuzzThreshold to 1
   * returns previous value, or undefined if it was not set before
   */
  update(
    key: string,
    value: DendronConfigValue
  ): ResultAsync<DendronConfigValue, IDendronError>;

  /**
   * Given a property path, delete the config entry in the persistent dendron config
   * e.g.) delete("commands.lookup.note.fuzzThreshold") will unset the property fuzzThreshold
   * returns previous value, or errors if it is not set.
   */
  delete(key: string): ResultAsync<DendronConfigValue, IDendronError>;
}
