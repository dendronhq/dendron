import React, { useRef, ReactNode, useState } from "react";
import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { List, Typography, Button, Card, message } from "antd";
import { useRouter } from "next/router";
import { FieldArray, Formik } from "formik";
import {
  Form,
  Input,
  Switch,
  Select,
  ResetButton,
  SubmitButton,
} from "formik-antd";
const { Title, Paragraph, Text, Link } = Typography;
import { MinusCircleOutlined } from "@ant-design/icons";
import _ from "lodash";
import Ajv, { JSONSchemaType } from "ajv";
import { engineHooks } from "@dendronhq/common-frontend";
import { configWrite } from "../../lib/effects";
import get from "lodash/get";

interface MyData {
  siteRootDir: string;
  assetsPrefix: string;
  siteRepoDir: string;
  copyAssets: boolean;
}

const siteConfig: ObjectConfig = {
  type: "object",
  data: {
    siteRootDir: {
      label: "Site Root Directory",
      type: "string",
      required: true,
      helperText:
        "Where your site will be published. Relative to Dendron workspace",
    },
    assetPrefix: {
      label: "Asset Prefix",
      type: "string",
      helperText: "If set, add prefix to all asset links",
    },
    copyAssets: {
      label: "Copy Assets",
      type: "boolean",
      helperText: "Copy assets from vault to site.",
    },
    siteRepotDir: {
      label: "Site Repo Directory",
      type: "string",
      helperText:
        "Location of the github repo where your site notes are located. By default, this is assumed to be your `workspaceRoot` if not set.",
    },
    usePrettyRefs: {
      label: "Use Pretty Refs?",
      type: "boolean",
      helperText:
        "Pretty refs help you identify when content is embedded from elsewhere and provide links back to the source.",
    },
    siteHierarchies: {
      type: "array",
      label: "Site Hierarchy",
      required: true,
      data: {
        type: "string",
        label: "Site Config",
        helperText: "Site configuration",
      },
    },
  },
};

const vaultSync: EnumConfig = {
  type: "enum",
  label: "Sync Options",
  data: ["skip", "noPush", "noCommit", "sync"],
};

const vault: ArrayConfig = {
  type: "array",
  label: "Vaults",
  data: {
    type: "object",
    data: {
      fsPath: {
        type: "string",
        label: "Filesystem Path",
        required: true,
        helperText: "Filesystem path to vault",
      },
      visibility: {
        type: "string",
        label: "Visibility",
        helperText: "Visibility of the vault",
      },
      sync: vaultSync,
    },
  },
};

const workspacesConfig: RecordConfig = {
  type: "record",
  label: "Workspaces",
  data: {
    type: "object",
    data: {
      workspaceEntry: {
        type: "string",
        label: "Remote Endpoint",
        helperText: "Remote endpoint for workspaces",
      },
    },
  },
};

const dendronConfig: ObjectConfig = {
  type: "object",
  data: {
    noCaching: {
      label: "No Caching?",
      type: "boolean",
      helperText: "Disable caching behavior",
    },
    noTelemetry: {
      label: "No telemetry?",
      type: "boolean",
      helperText: "Disable telemetry",
    },
    site: siteConfig,
    vaults: vault,
    workspaces: workspacesConfig,
  },
};

type CommonConfig = {
  required?: boolean;
  helperText?: string;
  label?: string;
};

type BooleanConfig = CommonConfig & { type: "boolean" };

type StringConfig = CommonConfig & { type: "string" };

type NumberConfig = CommonConfig & { type: "number" };

type EnumConfig = CommonConfig & { type: "enum"; data: string[] };

type ArrayConfig = CommonConfig & {
  type: "array";
  data: Config;
};

type RecordConfig = CommonConfig & {
  type: "record";
  data: Config;
};

type ObjectConfig = CommonConfig & {
  type: "object";
  data: Record<string, Config>;
};

type Config =
  | ArrayConfig
  | BooleanConfig
  | EnumConfig
  | StringConfig
  | NumberConfig
  | RecordConfig
  | ObjectConfig;

type ConfigInputType = {
  data: Config;
  prefix: string[];
  errors?: any;
  values?: any;
  addonAfter?: ReactNode;
};

type InputType = {
  label?: string;
  name: string;
  errors?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
};
type BaseInputType = InputType & { children?: ReactNode };
type SimpleInputType = InputType & {
  type: "string" | "number";
  addonAfter?: ReactNode;
};
type ArrayInputType = InputType & {
  data: Config;
  values: any;
  isRecordType?: boolean;
};
type SelectInputType = InputType & { data: EnumConfig };

const BaseInput = ({
  label,
  name,
  errors,
  required,
  helperText,
  children,
}: BaseInputType) => (
  <Form.Item
    name={name}
    style={{ justifyContent: "center" }}
    required={required}
  >
    <Title level={3} style={{ textTransform: "capitalize" }}>
      {label}
      {required && <span style={{ color: "red" }}> *</span>}
    </Title>
    {children}
    <br />
    <Text type="secondary">{helperText}</Text>
    <Text type="danger">{get(errors, name)}</Text>
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
}: SimpleInputType) => {
  return (
    <BaseInput {...{ name, label, required, helperText, errors }}>
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
}: SelectInputType) => {
  return (
    <BaseInput {...{ name, label, required, helperText, errors }}>
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
}: InputType) => {
  return (
    <BaseInput {...{ name, label, required, helperText, errors }}>
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
                dataDefinition: data,
                name,
                arrayHelpers,
                errors,
              }}
            />
          ) : (
            <RenderArray
              {...{
                values,
                dataDefinition: data,
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

const RenderRecord = ({
  values = [],
  dataDefinition,
  name,
  arrayHelpers,
  errors,
}: {
  values: any;
  dataDefinition: Config;
  name: any;
  arrayHelpers: any;
  errors: any;
}) => {
  type RecordProps = {
    id: number;
    value: string;
  };
  const [records, setRecords] = useState<RecordProps[]>(
    values
      ? Object.keys(values).map((key, index) => ({ id: index, value: key }))
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
        //ts-ignore
        title={
          <Input
            type="text"
            value={record.value}
            style={{ width: "85%" }}
            addonBefore="Key"
            onChange={(e) => handleChange({ ...record, value: e.target.value })}
          />
        }
        extra={<MinusCircleOutlined onClick={() => removeRecord(record)} />}
      >
        {Object.keys(dataDefinition.data.data).map((key) => (
          <ConfigInput
            key={`${name}.${record.value}.${key}`}
            values={values}
            data={dataDefinition.data.data[key]}
            errors={errors}
            prefix={[name, `${record.value}`, key]}
          />
        ))}
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
  dataDefinition: Config;
  name: any;
  arrayHelpers: any;
  errors: any;
}) => {
  const dataSource =
    dataDefinition.data.type === "object"
      ? values?.map((value: any, index: number) => (
          <Card
            key={`${name}.${index}`}
            size="small"
            title={index + 1}
            extra={
              <MinusCircleOutlined onClick={() => arrayHelpers.remove(index)} />
            }
          >
            {Object.keys(dataDefinition.data.data).map((key) => (
              <ConfigInput
                key={`${name}.${index}.${key}`}
                values={values}
                data={dataDefinition.data.data[key]}
                errors={errors}
                prefix={[name, `${index}`, key]}
              />
            ))}
          </Card>
        ))
      : values?.map((value: any, index: number) => (
          <ConfigInput
            key={`${name}.${index}`}
            values={values}
            data={dataDefinition.data}
            errors={errors}
            prefix={[name, `${index}`]}
            addonAfter={
              <MinusCircleOutlined onClick={() => arrayHelpers.remove(index)} />
            }
          />
        ));

  dataSource?.push(
    <Button type="primary" size="large" onClick={() => arrayHelpers.push(null)}>
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
}: ConfigInputType) => {
  const { type, required, helperText, label } = data;
  if (type === "string" || type === "number") {
    return (
      <SimpleInput
        name={prefix.join(".")}
        type={type}
        label={label}
        required={required}
        helperText={helperText}
        errors={errors}
        addonAfter={addonAfter}
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
      />
    );
  }

  if (type === "array" || type === "record") {
    const name = prefix.join(".");
    return (
      <ArrayInput
        values={get(values, name)}
        isRecordType={type === "record"}
        {...{ label, name, data, required, helperText, errors }}
      />
    );
  }
  if (type === "enum") {
    return (
      <SelectInput
        name={prefix.join(".")}
        {...{ label, data, values, errors, prefix }}
      />
    );
  }

  return (
    <>
      {Object.keys(data.data).map((key) => (
        <ConfigInput
          key={prefix.join(".") + "." + key}
          values={values}
          data={data.data[key]}
          errors={errors}
          prefix={[...prefix, key]}
        />
      ))}
    </>
  );
};

const generateSchema = (config: Config): any => {
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
    return { type: config.type, items: generateSchema(config.data) };
  }

  if (config.type === "record") {
    return {
      type: "object",
      patternProperties: {
        "^*$": Object.fromEntries(
          Object.keys(config.data.data).map((key) => [
            key,
            generateSchema(config.data.data[key]),
          ])
        ),
      },
    };
  }

  const schema: any = {
    type: "object",
    properties: Object.fromEntries(
      Object.keys(config.data).map((key) => [
        key,
        generateSchema(config.data[key]),
      ])
    ),
    required: Object.keys(config.data).filter(
      (key) => config.data[key].required
    ),
  };
  return schema;
};

const schema: JSONSchemaType<MyData> = generateSchema(dendronConfig);

export default function Config({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const router = useRouter();
  const { ws, port } = router.query;
  const dispatch = engineHooks.useEngineAppDispatch();
  const ajv = useRef(new Ajv({ allErrors: true }));
  const logger = createLogger("Config");
  if (!engine.config || !ws || !port) {
    return <></>;
  }

  console.log("config", engine.config);

  const generatedSchema = generateSchema(dendronConfig);
  console.log(generatedSchema, "yooooooo");

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Formik
        initialValues={engine.config}
        onSubmit={async (config, { setSubmitting }) => {
          const response: any = await dispatch(
            configWrite({
              config,
              ws: ws as string,
              port: Number(port as string),
            })
          );
          if (response.error) {
            message.error(response.payload);
          }
          message.success("Saved!");
          setSubmitting(false);
        }}
        validate={(values) => {
          let errors: any = {};
          const validate = ajv.current.compile(schema);
          validate(values);
          const { errors: ajvErrors } = validate;

          if (!ajvErrors?.length) {
            return {};
          }

          ajvErrors?.forEach((error) => {
            const { instancePath, message } = error;
            if (instancePath !== "") {
              errors[`${instancePath.substring(1)}`] = message;
            }
          });
          return { site: errors };
        }}
        validateOnChange={true}
      >
        {({ values, errors }) => (
          <Form {...formItemLayout}>
            <Typography style={{ textAlign: "center" }}>
              <Title>Dendron Configuration </Title>
            </Typography>
            <ConfigInput
              data={dendronConfig}
              values={values}
              errors={errors}
              prefix={[]}
            />
            <Form.Item name="submit" style={{ justifyContent: "center" }}>
              <Button.Group size="large">
                <ResetButton type="text">Clear changes</ResetButton>
                <SubmitButton type="primary" disabled={!_.isEmpty(errors.site)}>
                  Save changes
                </SubmitButton>
              </Button.Group>
            </Form.Item>
          </Form>
        )}
      </Formik>
    </div>
  );
}
