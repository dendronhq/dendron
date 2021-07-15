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

export type AnyOfConfig = CommonConfig & {
  type: "anyOf";
  data: Config[];
};

export type Config =
  | ArrayConfig
  | BooleanConfig
  | EnumConfig
  | StringConfig
  | NumberConfig
  | RecordConfig
  | ObjectConfig
  | AnyOfConfig;

export type ConfigInputType = {
  data: Config;
  prefix: string[];
  errors?: any;
  values?: any;
  addonAfter?: ReactNode;
  setSelectedKeys?: (keys: string[]) => void;
  setOpenKeys?: (keys: string[]) => void;
  setAnyOfValues: (values: { [key: string]: string }) => void;
  displayTitle?: boolean;
};

export type InputType = {
  label?: string;
  name: string;
  errors?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  setSelectedKeys?: (keys: string[]) => void;
  setOpenKeys?: (keys: string[]) => void;
};
export type BaseInputType = InputType & {
  children?: ReactNode;
  customStyles?: {};
};
export type SimpleInputType = InputType & {
  type: "text" | "number";
  addonAfter?: ReactNode;
};
export type ArrayInputType = InputType & {
  data: Config;
  values: any;
  isRecordType?: boolean;
  setAnyOfValues: any;
};
export type SelectInputType = InputType & { data: EnumConfig };
export type AnyOfInputType = InputType & {
  data: AnyOfConfig;
  values: any;
  setAnyOfValues: any;
};
