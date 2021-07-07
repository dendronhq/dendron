import { ReactNode } from "react";

export type CommonConfig = {
  required?: boolean;
  helperText?: string;
  label?: string;
};

export type BooleanConfig = CommonConfig & { type: "boolean" };

export type StringConfig = CommonConfig & { type: "string" };

export type NumberConfig = CommonConfig & { type: "number" };

export type EnumConfig = CommonConfig & { type: "enum"; data: string[] };

export type ArrayConfig = CommonConfig & {
  type: "array";
  data: Config;
};

export type RecordConfig = CommonConfig & {
  type: "record";
  data: Config;
};

export type ObjectConfig = CommonConfig & {
  type: "object";
  data: Record<string, Config>;
};

export type Config =
  | ArrayConfig
  | BooleanConfig
  | EnumConfig
  | StringConfig
  | NumberConfig
  | RecordConfig
  | ObjectConfig;

export type ConfigInputType = {
  data: Config;
  prefix: string[];
  errors?: any;
  values?: any;
  addonAfter?: ReactNode;
};

export type InputType = {
  label?: string;
  name: string;
  errors?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
};
export type BaseInputType = InputType & { children?: ReactNode };
export type SimpleInputType = InputType & {
  type: "text" | "number";
  addonAfter?: ReactNode;
};
export type ArrayInputType = InputType & {
  data: Config;
  values: any;
  isRecordType?: boolean;
};
export type SelectInputType = InputType & { data: EnumConfig };
