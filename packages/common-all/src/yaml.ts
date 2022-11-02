import YAML from "js-yaml";
import { fromThrowable, Result } from "neverthrow";
import type { AnyJson } from "./types";
import { yamlException, DendronErrorExperimental } from "./error";

type YAMLResult<T> = Result<T, DendronErrorExperimental>;

const load = fromThrowable(YAML.load, (error) => {
  return yamlException(error);
});

const dump = fromThrowable(YAML.dump, (error) => {
  return yamlException(error);
});

export const fromStr = (str: string, overwriteDuplicate?: boolean) => {
  return load(str, {
    schema: YAML.JSON_SCHEMA,
    json: overwriteDuplicate ?? false,
  }) as YAMLResult<AnyJson>;
};

export const toStr = (data: any) => {
  return dump(data, {
    indent: 4,
    schema: YAML.JSON_SCHEMA,
  }) as YAMLResult<string>;
};
