import YAML from "js-yaml";
import { fromThrowable, Result } from "neverthrow";
import type { AnyJson } from "./types";
import { ERROR_SEVERITY } from "./constants";
import { DendronError } from "./error";

const load = fromThrowable(YAML.load, (error) => {
  return new DendronError({
    message:
      error instanceof YAML.YAMLException
        ? `${error.name}: ${error.message}`
        : `YAMLException`,
    severity: ERROR_SEVERITY.FATAL,
    ...(error instanceof Error && { innerError: error }),
  });
});

const dump = fromThrowable(YAML.dump, (error) => {
  return new DendronError({
    message:
      error instanceof YAML.YAMLException
        ? `${error.name}: ${error.message}`
        : `YAMLException`,
    severity: ERROR_SEVERITY.FATAL,
    ...(error instanceof Error && { innerError: error }),
  });
});

export const fromStr = (str: string, overwriteDuplicate?: boolean) => {
  return load(str, {
    schema: YAML.JSON_SCHEMA,
    json: overwriteDuplicate ?? false,
  }) as Result<AnyJson, DendronError>;
};

export const toStr = (data: any) => {
  return dump(data, { indent: 4, schema: YAML.JSON_SCHEMA });
};
