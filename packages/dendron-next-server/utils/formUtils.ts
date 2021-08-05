import _ from "lodash";
import {
  DendronConfig,
  DendronSiteConfig,
  DVault,
} from "@dendronhq/common-all";

import {
  FieldProps,
  EnumFieldProps,
  StringFieldProps,
  NumberFieldProps,
  BooleanFieldProps,
  ArrayFieldProps,
  RecordFieldProps,
  ObjectFieldProps,
  AnyOfFieldProps,
} from "../types/formTypes";

export const generateSchema = (config: FieldProps): any => {
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
    const schema: any = {
      type: config.type,
      items: generateSchema(config.data),
    };

    if (config.required) {
      schema.minItems = 1;
    }
    return schema;
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
        generateSchema((config as ObjectFieldProps).data[key]),
      ])
    ),
    required: Object.keys(config.data).filter(
      (key) => (config as ObjectFieldProps).data[key].required
    ),
  };
  return schema;
};

export const generateRenderableConfig = (
  schema: any,
  definitions: any,
  label: string,
  required?: boolean
): FieldProps => {
  // `any` type generates empty config object, so we are assuming
  // that it's a string so that nothing breaks
  if (_.isEmpty(schema))
    return {
      type: "string",
      label,
      required,
    } as StringFieldProps;

  // check if instance of Object

  if (_.isObject(schema.type)) {
    // TODO: expect const or throw error
    return {
      type: "enum",
      data: schema.type.const,
      label,
      required,
    } as EnumFieldProps;
  }

  if (schema.type === "string") {
    return {
      type: "enum" in schema ? "enum" : "string",
      label,
      required,
      helperText: schema.description,
      data: "enum" in schema ? schema.enum : undefined,
    } as StringFieldProps | EnumFieldProps;
  }

  if (schema.type === "number" || schema.type === "boolean") {
    return {
      type: schema.type,
      helperText: schema.description,
      label,
      required,
    } as NumberFieldProps | BooleanFieldProps;
  }

  if (schema.type === "array") {
    return {
      type: schema.type,
      label,
      required,
      helperText: schema.description,
      data: generateRenderableConfig(schema.items, definitions, ""),
    } as ArrayFieldProps;
  }

  if ("anyOf" in schema) {
    const data = schema.anyOf
      .filter(({ not }: any) => !not)
      .map((schema: any) => generateRenderableConfig(schema, definitions, ""));
    if (data.length === 1) return data[0];
    return {
      type: "anyOf",
      label,
      helperText: schema.description,
      required,
      data,
    } as AnyOfFieldProps;
  }

  if ("$ref" in schema) {
    const src = schema.$ref.replace("#/definitions/", "");
    const data = _.get(definitions, src);
    return generateRenderableConfig(
      { ...data, description: schema.description },
      definitions,
      label
    );
  }

  if (schema.type === "object") {
    if (schema.additionalProperties) {
      return {
        type: "record",
        label,
        required,
        helperText: schema.description,
        data: generateRenderableConfig(
          schema.additionalProperties,
          definitions,
          ""
        ),
      } as RecordFieldProps;
    }

    return {
      type: "object",
      label,
      helperText: schema.description,
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
    } as ObjectFieldProps;
  }

  throw new Error("Schema generation for this type is not implemented yet!");
};

export type ConfigKey =
  | keyof DendronConfig
  | keyof DendronSiteConfig
  | keyof DVault;
export class FormUtils {
  static shouldBeReadOnly = (key: string) => {
    const READ_ONLY_KEYS: ConfigKey[] = ["vaults"];
    return READ_ONLY_KEYS.includes(key as ConfigKey);
  };
}
