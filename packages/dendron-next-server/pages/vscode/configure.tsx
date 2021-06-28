import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { List, Typography, Button } from "antd";
import { useRouter } from "next/router";
import { FieldArray, Formik } from "formik";
import { Form, Input, Switch, ResetButton, SubmitButton } from "formik-antd";
import React from "react";
const { Title, Paragraph, Text, Link } = Typography;
import { MinusOutlined } from "@ant-design/icons";
import _ from "lodash";
import Ajv, { JSONSchemaType } from "ajv";
import { useRef } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { engineHooks } from "@dendronhq/common-frontend";
import { configWrite } from "../../lib/effects";

interface MyData {
  siteRootDir: string;
}

const schema: JSONSchemaType<MyData> = {
  type: "object",
  properties: {
    // TODO: this regex only works with unix systems
    siteRootDir: {
      type: "string",
      minLength: 1,
      pattern: "(^/$|(^(?=/)|^.|^..)(/(?=[^/\0])[^/\0]+)*/?$)|()",
    },
    siteAssetsPrefix: { type: "string", minLength: 5 },
  },
  required: ["siteRootDir", "siteAssetsPrefix"],
  additionalProperties: true,
};

const createFormItem = ({
  name,
  label,
  required,
  helperText,
  error,
}: {
  name: string;
  placeholder?: string;
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}) => {
  return (
    <Form.Item name={name} style={{ justifyContent: "center" }}>
      <Title level={3}>
        {label}
        {required && <span style={{ color: "red" }}> *</span>}
      </Title>
      <Input size="large" name={name} />
      <Text type="secondary">{helperText}</Text>
      <br />
      <Text type="danger">{error}</Text>
    </Form.Item>
  );
};

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
  if (!engine.config) {
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
        onSubmit={(data) => {
          dispatch(configWrite({ config: data, ws, port }));
          return true;
        }}
        validate={(values) => {
          let errors: any = {};
          const { site } = values;
          const validate = ajv.current.compile(schema);
          validate(site);
          const { errors: ajvErrors } = validate;
          ajvErrors?.forEach((error) => {
            const { instancePath } = error;
            let message = "";
            if (error.keyword === "minLength") {
              message = `Must have at least ${error.params.limit} characters`;
            }
            if (instancePath !== "") {
              errors[`${instancePath.substring(1)}`] = message;
            }
          });
          return errors;
        }}
        validateOnChange={true}
      >
        {({ handleSubmit, handleChange, handleBlur, values, errors }) => (
          <Form {...formItemLayout}>
            <Typography style={{ textAlign: "center" }}>
              <Title>Dendron Configuration </Title>
            </Typography>
            <Form.Item
              name="siteHierarchies"
              style={{ justifyContent: "center" }}
            >
              <Title level={3}>Site Hierarchy</Title>
              <FieldArray
                name="site.siteHierarchies"
                render={(arrayHelpers) =>
                  renderArray(values.site.siteHierarchies, arrayHelpers)
                }
              />
            </Form.Item>
            {createFormItem({
              name: "site.siteRootDir",
              label: "Site root directory",
              required: true,
              helperText:
                "Where your site will be published, Relative to Dendron workspace.",
              error: errors.siteRootDir,
            })}
            {createFormItem({
              name: "site.siteNotesDir",
              label: "Site notes directory",
              helperText:
                "Folder where your notes will be kept. By default, `notes`",
            })}
            {createFormItem({
              name: "site.siteAssetsPrefix",
              label: "Assets Prefix",
              helperText: "If set, add prefix to all links.",
            })}
            {createFormItem({
              name: "site.siteRepoDir",
              label: "Site repo directory",
              helperText:
                "Location of the github repo where your site notes are located. By defualt, this is assumed to be your `workspaceRoot` if not set",
            })}
            <Form.Item
              style={{ justifyContent: "center" }}
              name="usePrettyRefSwitch"
            >
              <Title level={3}>Use Pretty Refs?</Title>
              <Switch name="site.siteUsePrettyRefs" />
              <br />
              <Text type="secondary">
                Pretty refs help you identify when content is embedded from
                elsewhere and provide links back to the source.
              </Text>
            </Form.Item>
            <Form.Item
              style={{ justifyContent: "center" }}
              name="siteRepoDirCheckedSwitch"
            >
              <Title level={3}>Site Repo directory</Title>
              <Switch name="site.useSiteRepoDir" />
              <br />
              <Text type="secondary">
                If enabled, assets will be copied from the vault to the site
              </Text>
            </Form.Item>
            <Form.Item name="submit" style={{ justifyContent: "center" }}>
              <Button.Group size="large">
                <ResetButton type="text">Cancel</ResetButton>
                <SubmitButton type="primary" disabled={!_.isEmpty(errors)}>
                  Submit
                </SubmitButton>
              </Button.Group>
            </Form.Item>
          </Form>
        )}
      </Formik>
    </div>
  );
}
