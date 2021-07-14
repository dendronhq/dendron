import _ from "lodash";

import {
  Config,
  EnumConfig,
  StringConfig,
  NumberConfig,
  BooleanConfig,
  ArrayConfig,
  RecordConfig,
  ObjectConfig,
  AnyOfConfig,
} from "../types/formTypes";

export const generateSchema = (config: Config): any => {
  if (_.isEmpty(config)) return {};
  if (
    config.type === "string" ||
    config.type === "number" ||
    config.type === "boolean"
  ) {
    return { type: config.type };
  }

  if (config.type === "enum") {
    return { enum: config.data };
  }

  if (config.type === "array") {
    return {
      type: config.type,
      items: generateSchema(config.data),
      minItems: config.required ? 1 : 0,
    };
  }

  if (config.type === "anyOf") {
    return { anyOf: config.data.map(generateSchema) };
  }

  if (config.type === "record") {
    return {
      type: "object",
      patternProperties: {
        "^[sS]+$": {
          ...generateSchema(config.data),
        },
      },
    };
  }

  const schema: any = {
    type: "object",
    properties: Object.fromEntries(
      Object.keys(config.data).map((key) => [
        key,
        generateSchema((config as ObjectConfig).data[key]),
      ])
    ),
    required: Object.keys(config.data).filter(
      (key) => (config as ObjectConfig).data[key].required
    ),
  };
  return schema;
};

export const generateRenderableConfig = (
  schema: any,
  definitions: any,
  label: string,
  required?: boolean
): Config => {
  // if ("not" in schema) return {} as Config;

  // console.log({ label, required }, "yooo");

  // `any` type generates empty config object, so we are assuming
  // that it's a string so that nothing breaks
  if (_.isEmpty(schema))
    return {
      type: "string",
      label,
      required,
    } as StringConfig;

  // check if instance of Object

  if (_.isObject(schema.type)) {
    // TODO: expect const or throw error
    return {
      type: "enum",
      data: schema.type.const,
      label,
      required,
    } as EnumConfig;
  }

  if (schema.type === "string") {
    return {
      type: "enum" in schema ? "enum" : "string",
      label,
      required,
      helperText: schema.description,
      data: "enum" in schema ? schema.enum : undefined,
    } as StringConfig | EnumConfig;
  }

  if (schema.type === "number" || schema.type === "boolean") {
    return {
      type: schema.type,
      helperText: schema.description,
      label,
      required,
    } as NumberConfig | BooleanConfig;
  }

  if (schema.type === "array") {
    return {
      type: schema.type,
      label,
      required,
      data: generateRenderableConfig(schema.items, definitions, ""),
    } as ArrayConfig;
  }

  if ("anyOf" in schema) {
    const data = schema.anyOf
      .filter(({ not }: any) => !not)
      .map((schema: any) => generateRenderableConfig(schema, definitions, ""));
    if (data.length === 1) return data[0];
    return {
      type: "anyOf",
      label,
      required,
      data,
    } as AnyOfConfig;
  }

  if ("$ref" in schema) {
    const src = schema.$ref.replace("#/definitions/", "");
    const data = _.get(definitions, src);
    return generateRenderableConfig(data, definitions, label);
  }

  if (schema.type === "object") {
    if (schema.additionalProperties) {
      return {
        type: "record",
        label,
        required,
        data: generateRenderableConfig(
          schema.additionalProperties,
          definitions,
          ""
        ),
      } as RecordConfig;
    }

    return {
      type: "object",
      label,
      data: Object.fromEntries(
        Object.entries(schema.properties).map(([key, child]) => [
          key,
          generateRenderableConfig(
            child,
            definitions,
            key,
            schema.required?.includes(key)
          ),
        ])
      ),
    } as ObjectConfig;
  }

  console.error({ schema });
  throw new Error("err");
};
