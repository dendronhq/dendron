import YAML from "js-yaml";
import {
  DendronError,
  ERROR_SEVERITY,
  AnyJson,
  fromThrowable,
  Result,
} from "@dendronhq/common-all";

export class YamlUtils {
  static load = fromThrowable(YAML.load, (error) => {
    return new DendronError({
      message:
        error instanceof YAML.YAMLException
          ? `${error.name}: ${error.message}`
          : `YAMLException`,
      severity: ERROR_SEVERITY.FATAL,
      ...(error instanceof Error && { innerError: error }),
    });
  });
  static dump = fromThrowable(YAML.dump, (error) => {
    return new DendronError({
      message:
        error instanceof YAML.YAMLException
          ? `${error.name}: ${error.message}`
          : `YAMLException`,
      severity: ERROR_SEVERITY.FATAL,
      ...(error instanceof Error && { innerError: error }),
    });
  });

  static fromStr(str: string, overwriteDuplicate?: boolean) {
    return this.load(str, {
      schema: YAML.JSON_SCHEMA,
      json: overwriteDuplicate ?? false,
    }) as Result<AnyJson, DendronError>;
  }
  static toStr(data: any) {
    return this.dump(data, { indent: 4, schema: YAML.JSON_SCHEMA });
  }
}
