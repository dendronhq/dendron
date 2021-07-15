import React, { ReactNode, useState } from "react";
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
  AnyOfConfig,
  AnyOfInputType,
} from "../types/formTypes";
import { shouldDisplay } from "../utils/shouldDisplay";
import bucketConfig from "../data/bucketConfig";

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
    bucketConfig[key].includes(openKeys[0])
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
        <Title id={name} level={3} style={{ fontFamily: "monospace" }}>
          {label}
          {required && <span style={{ color: "red" }}> *</span>}
        </Title>
        {helperText && (
          <>
            <Text type="secondary">{helperText}</Text>
            <br />
          </>
        )}
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
}: AnyOfInputType) => {
  const [value, setValue] = React.useState<string>("basic");
  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };
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
        data={(data as AnyOfConfig).data[value === "basic" ? 0 : 1]}
        errors={errors}
        prefix={[name]}
        setSelectedKeys={setSelectedKeys}
        setOpenKeys={setOpenKeys}
        displayTitle={false}
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
}: ArrayInputType) => {
  const props = {
    values,
    name,
    errors,
    setSelectedKeys,
    setOpenKeys,
  };

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
      <FieldArray
        name={name}
        render={(arrayHelpers) =>
          isRecordType ? (
            <RenderRecord
              dataDefinition={data as RecordConfig}
              arrayHelpers={arrayHelpers}
              {...props}
            />
          ) : (
            <RenderArray
              dataDefinition={data as ArrayConfig}
              arrayHelpers={arrayHelpers}
              {...props}
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
  setSelectedKeys,
  setOpenKeys,
}: {
  values: any;
  dataDefinition: RecordConfig;
  name: any;
  arrayHelpers: any;
  errors: any;
  setSelectedKeys?: (value: string[]) => void;
  setOpenKeys?: (value: string[]) => void;
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
        style={{
          borderWidth: 0,
        }}
      >
        <FormGenerator
          key={`${name}.${record.value}`}
          values={values}
          data={(dataDefinition as RecordConfig).data}
          errors={errors}
          prefix={[name, `${record.value}`]}
          setSelectedKeys={setSelectedKeys}
          setOpenKeys={setOpenKeys}
          displayTitle={false}
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
  setSelectedKeys,
  setOpenKeys,
}: {
  values: any;
  dataDefinition: ArrayConfig;
  name: any;
  arrayHelpers: any;
  errors: any;
  setSelectedKeys?: (value: string[]) => void;
  setOpenKeys?: (value: string[]) => void;
}) => {
  const dataSource =
    get(values, name)?.map((value: any, index: number) => (
      <Card
        key={`${name}.${index}`}
        size="small"
        title={index}
        extra={
          <MinusCircleOutlined onClick={() => arrayHelpers.remove(index)} />
        }
        style={{
          borderWidth: 0,
        }}
      >
        <FormGenerator
          key={`${name}.${index}`}
          values={values}
          data={dataDefinition.data}
          errors={errors}
          prefix={[name, `${index}`]}
          setSelectedKeys={setSelectedKeys}
          setOpenKeys={setOpenKeys}
          displayTitle={false}
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

const FormGenerator = ({
  data,
  values,
  errors,
  prefix,
  addonAfter,
  setSelectedKeys,
  setOpenKeys,
  displayTitle = true,
}: ConfigInputType) => {
  if (!data) return <></>;

  const lastName = prefix.length ? prefix[prefix.length - 1] : undefined;
  if (!shouldDisplay(lastName)) return <></>;

  const { type, required, helperText, label } = data;
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
        }}
      />
    );
  }
  if (type === "enum") {
    return (
      <SelectInput
        name={prefix.join(".")}
        data={data as EnumConfig}
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
        data={data as AnyOfConfig}
        {...{ label, values, errors, prefix, setSelectedKeys, setOpenKeys }}
      />
    );
  }

  return (
    <div style={largeFieldStyles}>
      {displayTitle && prefix.length !== 0 && (
        <Title
          level={2}
          style={{
            textTransform: "capitalize",
            // textAlign: "center",
            padding: "1rem 1rem 1rem 0rem",
          }}
          id={prefix.join(".")}
        >
          {prefix[prefix.length - 1]}
        </Title>
      )}
      {Object.keys((data as ObjectConfig).data).map((key) => (
        <FormGenerator
          key={prefix.join(".") + "." + key}
          values={values}
          data={(data as ObjectConfig).data[key]}
          errors={errors}
          prefix={[...prefix, key]}
          setSelectedKeys={setSelectedKeys}
          setOpenKeys={setOpenKeys}
        />
      ))}
    </div>
  );
};

export default FormGenerator;
