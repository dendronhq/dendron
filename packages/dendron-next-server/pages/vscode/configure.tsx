import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { List, Typography, Button, Space, message } from "antd";
import { useRouter } from "next/router";
import { FieldArray, Formik } from "formik";
import { Form, Input, Switch, ResetButton, SubmitButton } from "formik-antd";
import React from "react";
const { Title, Paragraph, Text, Link } = Typography;
import { MinusCircleOutlined } from "@ant-design/icons";
import _ from "lodash";
import Ajv, { JSONSchemaType } from "ajv";
import { useRef } from "react";
import { engineHooks } from "@dendronhq/common-frontend";
import { configWrite } from "../../lib/effects";
import { m } from "framer-motion";
import get from "lodash/get";

interface MyData {
  siteRootDir: string;
  assetsPrefix: string;
  siteRepoDir: string;
  copyAssets: boolean;
}

const siteConfig: ConfigType[] = [
  {
    label: "Site Root Directory",
    name: "siteRootDir",
    type: "string",
    required: true,
    helperText:
      "Where your site will be published. Relative to Dendron workspace",
  },
  {
    label: "Asset Prefix",
    name: "assetPrefix",
    type: "string",
    helperText: "If set, add prefix to all asset links",
  },
  {
    label: "Copy Assets",
    name: "copyAssets",
    type: "boolean",
    helperText: "Copy assets from vault to site.",
  },
  {
    label: "Site Repo Directory",
    name: "siteRepotDir",
    type: "string",
    helperText:
      "Location of the github repo where your site notes are located. By default, this is assumed to be your `workspaceRoot` if not set.",
  },
  {
    label: "Use Pretty Refs?",
    name: "usePrettyRefs",
    type: "boolean",
    helperText:
      "Pretty refs help you identify when content is embedded from elsewhere and provide links back to the source.",
  },
];

const vault: ConfigType[] = [
  {
    label: "Filesystem Path",
    name: "fsPath",
    type: "string",
    helperText: "Filesystem path to vault",
  },
  {
    label: "Visibility",
    name: "visibility",
    type: "string",
    helperText: "Visibility of the vault",
  },
];

const dendronConfig: ConfigType[] = [
  {
    label: "Site Config",
    name: "site.siteHierarchies",
    type: "array",
    helperText: "Site configuration",
  },
  {
    label: "No Caching?",
    name: "noCaching",
    type: "boolean",
    helperText: "Disable caching behavior",
  },
  {
    label: "No telemetry?",
    name: "noTelemetry",
    type: "boolean",
    helperText: "Disable telemetry",
  },
  {
    name: "site",
    type: "object",
    data: siteConfig,
  },
  {
    label: "Vault",
    name: "vaults",
    type: "array",
    data: vault,
  },
];

type ConfigType = {
  label?: string;
  name: string;
  type: string;
  required?: boolean;
  helperText?: string;
  data?: ConfigType[];
};

const flatten = (
  data: ConfigType[] | ConfigType,
  prefix: string[] = []
): ConfigType[] | ConfigType => {
  if (Array.isArray(data)) return data.flatMap((next) => flatten(next, prefix));
  return data.type !== "object"
    ? {
        ...data,
        name: prefix.concat(data.name).join("."),
      }
    : data.data.flatMap((next: any) => flatten(next, prefix.concat(data.name)));
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

const FormItem = ({
  name,
  label,
  type,
  data,
  values,
  required,
  helperText,
  error,
}: {
  name: string;
  placeholder?: string;
  label: string;
  data?: any;
  values?: any;
  type: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}) => (
  <Form.Item name={name} style={{ justifyContent: "center" }}>
    {console.log({ name, values }, "yoooooo")}
    <Title level={3}>
      {console.log(type)}
      {label}
      {required && <span style={{ color: "red" }}> *</span>}
    </Title>
    <Text type="secondary">{helperText}</Text>
    {type === "string" && <Input size="large" name={name} />}
    {type === "boolean" && (
      <>
        <br />
        <Switch name={name} />
        <br />
      </>
    )}
    {type === "array" && (
      <FieldArray
        name={name}
        render={(arrayHelpers) => renderArray(values, data, name, arrayHelpers)}
      />
    )}
    <br />
    <Text type="danger">{error}</Text>
  </Form.Item>
);

const renderArray = (
  arrayEnts: any[],
  dataDefinition: any,
  name: string,
  arrayHelpers: any
) => {
  const data = arrayEnts
    ?.map((_ent, idx) => (
      <>
        {typeof _ent !== "object" ? (
          <Input
            key={idx}
            size="large"
            name={`${name}.${idx}`}
            addonBefore={idx + 1 + "."}
            addonAfter={
              <MinusCircleOutlined onClick={() => arrayHelpers.remove(idx)} />
            }
          />
        ) : (
          <Space
            key={name}
            style={{ display: "flex", marginBottom: 8 }}
            align="baseline"
          >
            {dataDefinition
              .map(({ name: itemName, label }) => (
                <Input
                  key={`${idx}.${itemName}`}
                  size="large"
                  name={`${name}.${idx}.${itemName}`}
                  placeholder={label}
                />
              ))
              .concat(
                <MinusCircleOutlined onClick={() => arrayHelpers.remove(idx)} />
              )}
          </Space>
        )}
      </>
    ))
    .concat(
      <Button type="primary" size="large" onClick={() => arrayHelpers.push("")}>
        +
      </Button>
    );
  return (
    <List
      itemLayout="vertical"
      dataSource={data}
      bordered={false}
      renderItem={(item) => (
        <List.Item style={{ borderBottom: "none" }}>{item}</List.Item>
      )}
    />
  );
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

  console.log(engine.config, "yooooo");

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
            {flatten(dendronConfig).map(({ name, ...rest }) => (
              <FormItem
                key={name}
                name={name}
                {...rest}
                values={get(values, name)}
              />
            ))}
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
