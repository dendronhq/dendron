import React, { ReactNode, useState, useEffect } from "react";
import {
  List,
  Typography,
  Button,
  Card,
  Input as AntInput,
  Radio,
  RadioChangeEvent,
} from "antd";
import { FieldArray } from "formik";
import { Form, Input, Switch, Select } from "formik-antd";
const { Title, Text } = Typography;
import { MinusCircleOutlined } from "@ant-design/icons";
import _ from "lodash";
import get from "lodash/get";
import ReactMarkdown from "react-markdown";
import { ConfigAreas } from "../data/bucketConfig";

import {
  BaseInputType,
  InputType,
  SimpleInputType,
  SelectInputType,
  ArrayInputType,
  FieldProps,
  EnumFieldProps,
  ArrayFieldProps,
  RecordFieldProps,
  ObjectFieldProps,
  FormInputType,
  AnyOfFieldProps,
  AnyOfInputType,
} from "../types/formTypes";
import { shouldDisplay } from "../utils/shouldDisplay";
import bucketConfig from "../data/bucketConfig";
import { FormUtils } from "../utils/formUtils";
import { boolean } from "yup";

const largeFieldStyles = {
  paddingLeft: "10px",
  borderWidth: "0px 0px 0px 1px",
  borderRadius: 0,
  borderColor: "var(--antd-wave-shadow-color)",
  borderStyle: "solid",
};

const updateMenu = (name: string, setSelectedKeys: any, setOpenKeys: any) => {
  setSelectedKeys([name]);
  const allKeys: string[] = name.split(".");
  const openKeys: string[] =
    allKeys.length > 1 ? allKeys.slice(0, -1) : allKeys;
  const bucketName: string[] = Object.keys(bucketConfig).filter((key) =>
    bucketConfig[key as ConfigAreas].includes(openKeys[0])
  );
  setOpenKeys(() =>
    allKeys.length > 1 ? [bucketName[0], ...openKeys] : [bucketName[0]]
  );
};

const BaseInput = ({
  label,
  name,
  errors,
  required,
  helperText,
  children,
  customStyles,
}: BaseInputType) => {
  const error = React.useMemo(() => get(errors, name), [errors, name]);
  return (
    <Form.Item name={name} required={required}>
      <div style={{ ...customStyles }}>
        <Title id={name} level={3}>
          {label}
          {required && <span style={{ color: "red" }}> *</span>}
        </Title>
        {helperText?.split("\n").map((line, index) => (
          <>
            <Text type="secondary" key={index}>
              <ReactMarkdown>{line}</ReactMarkdown>
            </Text>
          </>
        ))}

        {children}
        {error && (
          <>
            <br />
            <Text
              type="danger"
              style={{ fontWeight: "bold", textTransform: "capitalize" }}
            >
              {`Error: ${error}`}
            </Text>
          </>
        )}
      </div>
    </Form.Item>
  );
};

const SimpleInput = ({
  name,
  type,
  label,
  placeholder,
  required,
  helperText,
  errors,
  addonAfter,
  setSelectedKeys,
  setOpenKeys,
  readOnly,
}: SimpleInputType) => {
  return (
    <BaseInput
      {...{
        name,
        label,
        required,
        helperText,
        errors,
      }}
    >
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        readOnly={readOnly || false}
        required={required}
        addonAfter={addonAfter}
        onClick={() => updateMenu(name, setSelectedKeys, setOpenKeys)}
      />
    </BaseInput>
  );
};

const SelectInput = ({
  name,
  label,
  data,
  required,
  helperText,
  errors,
  setSelectedKeys,
  setOpenKeys,
}: SelectInputType) => {
  return (
    <BaseInput
      {...{
        name,
        label,
        required,
        helperText,
        errors,
        setSelectedKeys,
        setOpenKeys,
      }}
    >
      <Select
        name={name}
        onClick={() => updateMenu(name, setSelectedKeys, setOpenKeys)}
      >
        {data.data.map((value) => (
          <Select.Option key={value} value={value}>
            {value}
          </Select.Option>
        ))}
      </Select>
    </BaseInput>
  );
};

const BooleanInput = ({
  name,
  label,
  required,
  helperText,
  errors,
  setSelectedKeys,
  setOpenKeys,
}: InputType) => {
  return (
    <BaseInput {...{ name, label, required, helperText, errors }}>
      <Switch
        name={name}
        onClick={() => updateMenu(name, setSelectedKeys, setOpenKeys)}
      />
    </BaseInput>
  );
};

const AnyOfInput = ({
  name,
  data,
  values,
  label,
  required,
  helperText,
  errors,
  setSelectedKeys,
  setOpenKeys,
  setAnyOfValues,
}: AnyOfInputType) => {
  const [value, setValue] = React.useState<string>("basic");
  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };

  useEffect(
    () => setAnyOfValues((prev: any) => ({ ...prev, [name]: value })),
    [value, setAnyOfValues]
  );
  return (
    <BaseInput
      {...{
        name,
        label,
        required,
        helperText,
        errors,
        customStyles: largeFieldStyles,
      }}
    >
      <Radio.Group onChange={onChange} value={value}>
        <Radio value={"basic"}>Basic</Radio>
        <Radio value={"advanced"}>Advanced</Radio>
      </Radio.Group>

      <FormGenerator
        values={values}
        field={(data as AnyOfFieldProps).data[value === "basic" ? 0 : 1]}
        errors={errors}
        prefix={[name]}
        setSelectedKeys={setSelectedKeys}
        setOpenKeys={setOpenKeys}
        displayTitle={false}
        setAnyOfValues={setAnyOfValues}
        parentField={data}
      />
    </BaseInput>
  );
};

const ArrayInput = ({
  name,
  values,
  data,
  label,
  required,
  helperText,
  errors,
  isRecordType = false,
  setSelectedKeys,
  setOpenKeys,
  setAnyOfValues,
  readOnly,
}: ArrayInputType) => {
  const props = {
    values,
    name,
    errors,
    setSelectedKeys,
    setOpenKeys,
    setAnyOfValues,
  };

  return (
    <BaseInput
      {...{
        name,
        label,
        required,
        helperText,
        errors,
        readOnly,
        customStyles: largeFieldStyles,
      }}
    >
      <FieldArray
        name={name}
        render={(arrayHelpers) =>
          isRecordType ? (
            <RenderRecord
              dataDefinition={data as RecordFieldProps}
              arrayHelpers={arrayHelpers}
              readOnly={readOnly}
              {...props}
            />
          ) : (
            <RenderArray
              dataDefinition={data as ArrayFieldProps}
              arrayHelpers={arrayHelpers}
              readOnly={readOnly}
              {...props}
            />
          )
        }
      />
    </BaseInput>
  );
};

const makeDefault = (config: FieldProps): any => {
  const { type } = config;
  switch (type) {
    case "array":
      return [];
    case "boolean":
      return false;
    case "enum":
      return (config as EnumFieldProps).data[0];
    case "number":
      return 0;
    case "object":
      return Object.fromEntries(
        Object.entries((config as ObjectFieldProps).data).map(([k, v]) => [
          k,
          makeDefault(v),
        ])
      );
    case "string":
      return "";
    case "record":
      return {};
    default:
      return null;
  }
};

const RenderRecord = ({
  values = [],
  dataDefinition,
  name,
  arrayHelpers,
  errors,
  setSelectedKeys,
  setOpenKeys,
  setAnyOfValues,
  readOnly,
}: {
  values: any;
  dataDefinition: RecordFieldProps;
  name: any;
  arrayHelpers: any;
  errors: any;
  readOnly?: boolean;
  setSelectedKeys?: (value: string[]) => void;
  setOpenKeys?: (value: string[]) => void;
  setAnyOfValues: (values: { [key: string]: string }) => void;
}) => {
  type RecordProps = {
    id: number;
    value: string;
  };
  const [records, setRecords] = useState<RecordProps[]>(
    get(values, name)
      ? Object.keys(get(values, name)).map((key, index) => ({
          id: index,
          value: key,
        }))
      : []
  );
  const addRecord = (record: RecordProps) =>
    setRecords((prev: RecordProps[]) => [...prev, record]);
  const removeRecord = (record: RecordProps) =>
    setRecords((prev: RecordProps[]) =>
      prev.filter((r: RecordProps) => r.id !== record.id)
    );
  const handleChange = (record: RecordProps) =>
    setRecords((prev) =>
      prev.map((r: RecordProps) => (r.id !== record.id ? r : record))
    );

  const dataSource = records?.map((record: RecordProps, index: number) => (
    <Card
      key={`${name}.${index}`}
      size="small"
      title={
        <AntInput
          type="text"
          value={record.value}
          style={{ width: "85%" }}
          addonBefore="Key"
          onChange={(e) => handleChange({ ...record, value: e.target.value })}
        />
      }
      extra={
        readOnly ? undefined : (
          <MinusCircleOutlined onClick={() => removeRecord(record)} />
        )
      }
      style={{
        borderWidth: 0,
      }}
    >
      <p>Rendering Record</p>
      <FormGenerator
        key={`${name}.${record.value}`}
        values={values}
        field={(dataDefinition as RecordFieldProps).data}
        errors={errors}
        prefix={[name, `${record.value}`]}
        setSelectedKeys={setSelectedKeys}
        setOpenKeys={setOpenKeys}
        displayTitle={false}
        setAnyOfValues={setAnyOfValues}
        parentField={dataDefinition}
      />
    </Card>
  ));
  if (!readOnly) {
    dataSource.push(
      <Button
        type="primary"
        size="large"
        onClick={() =>
          addRecord({
            id: records.length ? records[records.length - 1].id + 1 : 0,
            value: "",
          })
        }
      >
        Add
      </Button>
    );
  }

  return (
    <List
      itemLayout="vertical"
      dataSource={dataSource}
      bordered={false}
      renderItem={(item: ReactNode) => (
        <List.Item style={{ borderBottom: "none" }}>{item}</List.Item>
      )}
    />
  );
};

const RenderArray = ({
  values = [],
  dataDefinition,
  name,
  arrayHelpers,
  errors,
  readOnly,
  setSelectedKeys,
  setOpenKeys,
  setAnyOfValues,
}: {
  values: any;
  readOnly?: boolean;
  dataDefinition: ArrayFieldProps;
  name: any;
  arrayHelpers: any;
  errors: any;
  setSelectedKeys?: (value: string[]) => void;
  setOpenKeys?: (value: string[]) => void;
  setAnyOfValues: (values: { [key: string]: string }) => void;
}) => {
  const dataSource =
    get(values, name)?.map((value: any, index: number) => (
      <Card
        key={`${name}.${index}`}
        size="small"
        title={index}
        extra={
          readOnly ? undefined : (
            <MinusCircleOutlined onClick={() => arrayHelpers.remove(index)} />
          )
        }
        style={{
          borderWidth: 0,
        }}
      >
        <p>Rendering Array</p>
        <FormGenerator
          key={`${name}.${index}`}
          values={values}
          field={dataDefinition.data}
          errors={errors}
          prefix={[name, `${index}`]}
          setSelectedKeys={setSelectedKeys}
          setOpenKeys={setOpenKeys}
          displayTitle={false}
          setAnyOfValues={setAnyOfValues}
          parentField={dataDefinition}
        />
      </Card>
    )) ?? [];
  if (!readOnly) {
    dataSource?.push(
      <Button
        type="primary"
        size="large"
        onClick={() => arrayHelpers.push(makeDefault(dataDefinition.data))}
      >
        Add
      </Button>
    );
  }

  return (
    <List
      itemLayout="vertical"
      dataSource={dataSource}
      bordered={false}
      renderItem={(item: ReactNode) => (
        <List.Item style={{ borderBottom: "none" }}>{item}</List.Item>
      )}
    />
  );
};

const FormGenerator = ({
  field: data,
  values,
  errors,
  prefix,
  addonAfter,
  setSelectedKeys,
  setOpenKeys,
  setAnyOfValues,
  displayTitle = true,
  parentField,
}: FormInputType) => {
  if (!data) return <></>;

  const lastName = prefix.length ? prefix[prefix.length - 1] : undefined;
  const { type, required: fieldRequired, helperText, label } = data;
  // if parent is not required, children fields are not required
  const required = !_.isNull(parentField)
    ? fieldRequired && parentField.required
    : fieldRequired;

  if (!shouldDisplay(lastName)) return <></>;
  const readOnly = FormUtils.shouldBeReadOnly(lastName || "");

  if (type === "string" || type === "number") {
    return (
      <SimpleInput
        name={prefix.join(".")}
        type={type === "string" ? "text" : type}
        {...{
          label,
          required,
          helperText,
          errors,
          addonAfter,
          setSelectedKeys,
          setOpenKeys,
          readOnly,
        }}
      />
    );
  }
  if (type === "boolean") {
    return (
      <BooleanInput
        name={prefix.join(".")}
        label={label}
        required={required}
        helperText={helperText}
        errors={errors}
        setSelectedKeys={setSelectedKeys}
        setOpenKeys={setOpenKeys}
      />
    );
  }

  if (type === "array" || type === "record") {
    const name = prefix.join(".");
    return (
      <ArrayInput
        values={values}
        isRecordType={type === "record"}
        {...{
          label,
          name,
          data,
          required,
          helperText,
          errors,
          setSelectedKeys,
          setOpenKeys,
          setAnyOfValues,
          readOnly,
        }}
      />
    );
  }
  if (type === "enum") {
    return (
      <SelectInput
        name={prefix.join(".")}
        data={data as EnumFieldProps}
        {...{
          label,
          values,
          helperText,
          errors,
          prefix,
          setSelectedKeys,
          setOpenKeys,
        }}
      />
    );
  }

  if (type === "anyOf") {
    return (
      <AnyOfInput
        name={prefix.join(".")}
        data={data as AnyOfFieldProps}
        {...{
          label,
          helperText,
          values,
          errors,
          prefix,
          setSelectedKeys,
          setOpenKeys,
          setAnyOfValues,
        }}
      />
    );
  }

  return (
    <div style={largeFieldStyles}>
      {displayTitle && prefix.length !== 0 && (
        <Title
          level={2}
          style={{
            padding: "1rem 1rem 1rem 0rem",
          }}
          id={prefix.join(".")}
        >
          {prefix[prefix.length - 1]}
        </Title>
      )}
      {helperText
        ?.split("\n")
        .map((line, index) => (
          <>
            <Text type="secondary" key={index}>
              {line}
            </Text>
            <br />
          </>
        ))
        .concat([<br key="br" />])}
      {Object.keys((data as ObjectFieldProps).data).map((key) => (
        <FormGenerator
          key={prefix.join(".") + "." + key}
          values={values}
          field={(data as ObjectFieldProps).data[key]}
          errors={errors}
          prefix={[...prefix, key]}
          setSelectedKeys={setSelectedKeys}
          setOpenKeys={setOpenKeys}
          setAnyOfValues={setAnyOfValues}
          parentField={data}
        />
      ))}
    </div>
  );
};

export default FormGenerator;
