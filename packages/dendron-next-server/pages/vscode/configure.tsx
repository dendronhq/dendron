import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { List, Typography, Button, message } from "antd";
import { useRouter } from "next/router";
import { FieldArray, Formik } from "formik";
import { Form, Input, Switch, ResetButton, SubmitButton } from "formik-antd";
import React from "react";
const { Title, Paragraph, Text, Link } = Typography;
import { MinusOutlined } from "@ant-design/icons";
import _ from "lodash";
import Ajv, { JSONSchemaType } from "ajv";
import { useRef } from "react";
import { engineHooks } from "@dendronhq/common-frontend";
import { configWrite } from "../../lib/effects";
import { m } from "framer-motion";

interface MyData {
  siteRootDir: string;
  assetsPrefix: string;
  siteRepoDir: string;
  copyAssets: boolean;
}

const siteConfig = [
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

const dendronConfig = [
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
];

const flatten = (data: any, prefix: string[] = []) => {
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
  required,
  helperText,
  error,
}: {
  name: string;
  placeholder?: string;
  label: string;
  type: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}) => (
  <Form.Item name={name} style={{ justifyContent: "center" }}>
    <Title level={3}>
      {console.log(type)}
      {label}
      {required && <span style={{ color: "red" }}> *</span>}
    </Title>
    {type === "string" && <Input size="large" name={name} />}
    {type === "boolean" && (
      <>
        <Switch name={name} />
        <br />
      </>
    )}
    <Text type="secondary">{helperText}</Text>
    <br />
    <Text type="danger">{error}</Text>
  </Form.Item>
);

const renderArray = (arrayEnts: any[], arrayHelpers: any) => {
  const data = arrayEnts
    .map((_ent, idx) => (
      <>
        <Input
          key={idx}
          size="large"
          name={`site.siteHierarchies.${idx}`}
          addonBefore={idx + 1 + "."}
          addonAfter={
            <MinusOutlined onClick={() => arrayHelpers.remove(idx)} />
          }
        />
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
            <Form.Item
              name="siteHierarchies"
              style={{ justifyContent: "center" }}
            >
              <Title level={3}>Site Config</Title>
              <FieldArray
                name="site.siteHierarchies"
                render={(arrayHelpers) =>
                  renderArray(values.site.siteHierarchies, arrayHelpers)
                }
              />
            </Form.Item>
            {flatten(dendronConfig).map(({ name, ...rest }) => (
              <FormItem key={name} name={name} {...rest} />
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
