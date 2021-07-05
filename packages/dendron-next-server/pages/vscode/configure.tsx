import React, { useRef, ReactNode } from "react";
import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { List, Typography, Button, Card, message } from "antd";
import { useRouter } from "next/router";
import { FieldArray, Formik } from "formik";
import { Form, Input, Switch, ResetButton, SubmitButton } from "formik-antd";
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
  },
};

const vault: ArrayConfig = {
  type: "array",
  data: {
    type: "object",
    data: {
      fsPath: {
        label: "Filesystem Path",
        type: "string",
        helperText: "Filesystem path to vault",
      },
      visibility: {
        label: "Visibility",
        type: "string",
        helperText: "Visibility of the vault",
      },
    },
  },
};

const dendronConfig: ObjectConfig = {
  type: "object",
  data: {
    "site.siteHierarchies": {
      type: "array",
      data: {
        type: "string",
        label: "Site Config",
        helperText: "Site configuration",
      },
    },
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
  },
};

type ConfigType = {
  label?: string;
  name: string;
  type: string;
  required?: boolean;
  helperText?: string;
  data?: ConfigType[];
};

type FieldType =
  | "string"
  | "boolean"
  | "number"
  | "enum"
  | "array"
  | "object"
  | "record";

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
type SimpleInputType = InputType & { type: "string" | "number" };
type ArrayInputType = InputType & { data: Config; values: any };

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
    rules={[{ required: required, message: `This information is required!` }]}
  >
    <Title level={3} style={{ textTransform: "capitalize" }}>
      {label}
    </Title>
    {children}
    <br />
    <Text type="secondary">{helperText}</Text>
    <br />
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
}: SimpleInputType) => {
  return (
    <BaseInput {...{ name, label, required, helperText, errors }}>
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
      />
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
}: ArrayInputType) => {
  return (
    <BaseInput {...{ name, label, required, helperText, errors }}>
      <FieldArray
        name={name}
        render={(arrayHelpers) =>
          renderArray(values, data, name, arrayHelpers, errors)
        }
      />
    </BaseInput>
  );
};

const renderArray = (
  values: any,
  dataDefinition: Config,
  name: any,
  arrayHelpers: any,
  errors: any
) => {
  const dataSource =
    dataDefinition.data.type === "object"
      ? values.map((value: any, index: number) => (
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
      : values.map((value: any, index: number) => (
          <Card
            key={`${name}.${index}`}
            size="small"
            title={index + 1}
            extra={
              <MinusCircleOutlined onClick={() => arrayHelpers.remove(index)} />
            }
          >
            <ConfigInput
              values={values}
              data={dataDefinition.data}
              errors={errors}
              prefix={[name, `${index}`]}
            />
          </Card>
        ));

  dataSource.concat(
    <Button type="primary" size="large" onClick={() => arrayHelpers.add()}>
      +
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

const ConfigInput = ({ data, values, errors, prefix }: ConfigInputType) => {
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

  if (type === "array") {
    const name = prefix.join(".");
    return (
      <ArrayInput
        values={get(values, name)}
        label={prefix[prefix.length - 1].split(".").pop()}
        {...{ name, data, required, helperText, errors }}
      />
    );
  }
  if (type === "enum") return <></>;
  if (type === "record") return <></>;

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

const schema: JSONSchemaType<MyData> = {
  type: "object",
  properties: {
    siteRootDir: {
      type: "string",
    },
    assetsPrefix: {
      type: "string",
    },
    copyAssets: {
      type: "boolean",
    },
    siteRepoDir: { type: "string" },
  },
  required: ["siteRootDir"],
  additionalProperties: true,
};

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
          const { site } = values;
          const validate = ajv.current.compile(schema);
          validate(site);
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
