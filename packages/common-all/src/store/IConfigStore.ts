import { ResultAsync } from "neverthrow";
import { URI } from "vscode-uri";
import { DendronError } from "../error";
import { DendronConfig, Disposable } from "../types";

export type BaseConfigPayload = {
  uri: URI;
  config: DendronConfig;
};

export type ConfigValue = string | number | object;
export type BaseConfigEntryPayload = { value: ConfigValue };

export type ConfigCreateResult = {} & BaseConfigPayload;
export type ConfigReadResult = {} & BaseConfigPayload;
export type ConfigUpdateResult = {} & BaseConfigPayload;
export type ConfigEntryGetResult = {} & BaseConfigEntryPayload;
export type ConfigEntryUpdateResult = {
  prevValue: ConfigValue;
} & BaseConfigEntryPayload;
export type ConfigEntryDeleteResult = { prevValue: ConfigValue };

export interface IConfigStore extends Disposable {
  // entire config

  /**
   * Create a persistant dendron config
   * If a persistant dendron config exists, return an error
   */
  create(): ResultAsync<ConfigCreateResult, DendronError>;
  /**
   * Read the entire dendron config
   */
  read(applyOverride?: boolean): ResultAsync<ConfigReadResult, DendronError>;
  /**
   * Given a dendron config, update the persistant dendron config with the given payload
   */
  update(payload: DendronConfig): ResultAsync<ConfigUpdateResult, DendronError>;

  // individual keys
  /**
   * Given a dot delimited path, retrieve the config entry value in the persistant dendron config
   */
  get(key: string): ResultAsync<ConfigEntryGetResult, DendronError>;
  /**
   * Given a dot delimited path, update the config entry value with given value in the persistant dendron config
   */
  update(
    key: string,
    value: ConfigValue
  ): ResultAsync<ConfigEntryUpdateResult, DendronError>;
  /**
   * Given a dot delimited path, delete the config entry in the persistant dendron config
   */
  delete(key: string): ResultAsync<ConfigEntryDeleteResult, DendronError>;
}
