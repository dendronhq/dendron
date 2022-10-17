import YAML from "js-yaml";
import {
  DendronError,
  ERROR_SEVERITY,
  AnyJson,
  fromThrowable,
  Result,
} from "@dendronhq/common-all";

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
