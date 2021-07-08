import React, { ReactNode, useState } from "react";
import { List, Typography, Button, Card, Input as AntInput } from "antd";
import { FieldArray } from "formik";
import { Form, Input, Switch, Select } from "formik-antd";
const { Title, Text } = Typography;
import { MinusCircleOutlined } from "@ant-design/icons";
import _ from "lodash";
import get from "lodash/get";

import {
  BaseInputType,
  InputType,
  SimpleInputType,
  SelectInputType,
  ArrayInputType,
  Config,
  EnumConfig,
  ArrayConfig,
  RecordConfig,
  ObjectConfig,
  ConfigInputType,
} from "../types/formTypes";

const BaseInput = ({
  label,
  name,
  errors,
  required,
  helperText,
  children,
  setSelectedKeys,
}: BaseInputType) => (
  <Form.Item
    name={name}
    style={{ justifyContent: "center" }}
    required={required}
  >
    <div onClick={() => setSelectedKeys && setSelectedKeys([name])}>
      <Title id={name} level={3} style={{ textTransform: "capitalize" }}>
        {label}
        {required && <span style={{ color: "red" }}> *</span>}
      </Title>
      {children}
      <br />
      <Text type="secondary">{helperText}</Text>
      <Text type="danger">{get(errors, name)}</Text>
    </div>
  </Form.Item>
);

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
}: SimpleInputType) => {
  return (
    <BaseInput
      {...{ name, label, required, helperText, errors, setSelectedKeys }}
    >
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        addonAfter={addonAfter}
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
}: SelectInputType) => {
  return (
    <BaseInput
      {...{ name, label, required, helperText, errors, setSelectedKeys }}
    >
      <Select name={name}>
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
}: InputType) => {
  return (
    <BaseInput
      {...{ name, label, required, helperText, errors, setSelectedKeys }}
    >
      <Switch name={name} />
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
}: ArrayInputType) => {
  return (
    <BaseInput {...{ name, label, required, helperText, errors }}>
      <FieldArray
        name={name}
        render={(arrayHelpers) =>
          isRecordType ? (
            <RenderRecord
              {...{
                values,
                dataDefinition: data as RecordConfig,
                name,
                arrayHelpers,
                errors,
              }}
            />
          ) : (
            <RenderArray
              {...{
                values,
                dataDefinition: data as ArrayConfig,
                name,
                arrayHelpers,
                errors,
              }}
            />
          )
        }
      />
    </BaseInput>
  );
};

const makeDefault = (config: Config): any => {
  const { type } = config;
  switch (type) {
    case "array":
      return [];
    case "boolean":
      return false;
    case "enum":
      return (config as EnumConfig).data[0];
    case "number":
      return 0;
    case "object":
      return Object.fromEntries(
        Object.entries((config as ObjectConfig).data).map(([k, v]) => [
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
}: {
  values: any;
  dataDefinition: RecordConfig;
  name: any;
  arrayHelpers: any;
  errors: any;
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

  const dataSource = records
    ?.map((record: RecordProps, index: number) => (
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
        extra={<MinusCircleOutlined onClick={() => removeRecord(record)} />}
      >
        <ConfigInput
          key={`${name}.${record.value}`}
          values={values}
          data={(dataDefinition as RecordConfig).data}
          errors={errors}
          prefix={[name, `${record.value}`]}
        />
      </Card>
    ))
    .concat(
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
}: {
  values: any;
  dataDefinition: ArrayConfig;
  name: any;
  arrayHelpers: any;
  errors: any;
}) => {
  const dataSource =
    get(values, name)?.map((value: any, index: number) => (
      <Card
        key={`${name}.${index}`}
        size="small"
        title={index + 1}
        extra={
          <MinusCircleOutlined onClick={() => arrayHelpers.remove(index)} />
        }
      >
        <ConfigInput
          key={`${name}.${index}`}
          values={values}
          data={dataDefinition.data}
          errors={errors}
          prefix={[name, `${index}`]}
        />
      </Card>
    )) ?? [];

  dataSource?.push(
    <Button
      type="primary"
      size="large"
      onClick={() => arrayHelpers.push(makeDefault(dataDefinition.data))}
    >
      Add
    </Button>
  );

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

const ConfigInput = ({
  data,
  values,
  errors,
  prefix,
  addonAfter,
  setSelectedKeys,
}: ConfigInputType) => {
  const { type, required, helperText, label } = data;
  if (type === "string" || type === "number") {
    return (
      <SimpleInput
        name={prefix.join(".")}
        type={type === "string" ? "text" : type}
        label={label}
        required={required}
        helperText={helperText}
        errors={errors}
        addonAfter={addonAfter}
        setSelectedKeys={setSelectedKeys}
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
        }}
      />
    );
  }
  if (type === "enum") {
    return (
      <SelectInput
        name={prefix.join(".")}
        data={data as EnumConfig}
        {...{ label, values, errors, prefix, setSelectedKeys }}
      />
    );
  }

  return (
    <>
      {Object.keys((data as ObjectConfig).data).map((key) => (
        <ConfigInput
          key={prefix.join(".") + "." + key}
          values={values}
          data={(data as ObjectConfig).data[key]}
          errors={errors}
          prefix={[...prefix, key]}
          setSelectedKeys={setSelectedKeys}
        />
      ))}
    </>
  );
};

export default ConfigInput;
