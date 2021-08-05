import { ReactNode } from "react";

export type CommonFieldProps = {
  required?: boolean;
  helperText?: string;
  label?: string;
};

export type BooleanFieldProps = CommonFieldProps & { type: "boolean" };

export type StringFieldProps = CommonFieldProps & { type: "string" };

export type NumberFieldProps = CommonFieldProps & { type: "number" };

export type EnumFieldProps = CommonFieldProps & {
  type: "enum";
  data: string[];
};

export type ArrayFieldProps = CommonFieldProps & {
  type: "array";
  data: FieldProps;
};

export type RecordFieldProps = CommonFieldProps & {
  type: "record";
  data: FieldProps;
};

export type ObjectFieldProps = CommonFieldProps & {
  type: "object";
  data: Record<string, FieldProps>;
};

export type AnyOfFieldProps = CommonFieldProps & {
  type: "anyOf";
  data: FieldProps[];
};

/**
 * FieldType
 */
export type FieldProps =
  | ArrayFieldProps
  | BooleanFieldProps
  | EnumFieldProps
  | StringFieldProps
  | NumberFieldProps
  | RecordFieldProps
  | ObjectFieldProps
  | AnyOfFieldProps;

export type FormInputType = {
  field: FieldProps;
  prefix: string[];
  errors?: any;
  values?: any;
  addonAfter?: ReactNode;
  setSelectedKeys?: (keys: string[]) => void;
  setOpenKeys?: (keys: string[]) => void;
  setAnyOfValues: (values: { [key: string]: string }) => void;
  displayTitle?: boolean;
  /**
   * Check if parent field was required. If not, required children field
   * should not be required either unless parent is set
   */
  parentField: FieldProps | null;
};

export type InputType = {
  label?: string;
  name: string;
  errors?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  readOnly?: boolean;
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
  data: FieldProps;
  values: any;
  isRecordType?: boolean;
  setAnyOfValues: any;
};
export type SelectInputType = InputType & { data: EnumFieldProps };
export type AnyOfInputType = InputType & {
  data: AnyOfFieldProps;
  values: any;
  setAnyOfValues: any;
};
