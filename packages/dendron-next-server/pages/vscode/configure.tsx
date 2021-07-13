import React, { useRef, useState, useEffect, useMemo } from "react";
import { engineSlice } from "@dendronhq/common-frontend";
import { Typography, Button, Layout, message } from "antd";
import { useRouter } from "next/router";
import { Formik } from "formik";
import { Form, ResetButton, SubmitButton } from "formik-antd";
import _ from "lodash";
import Ajv, { JSONSchemaType } from "ajv";
import { engineHooks } from "@dendronhq/common-frontend";
import { configWrite } from "../../lib/effects";
import ConfigInput from "../../components/formRenderer";
import SideMenu from "../../components/sideMenu";
import {
  Config,
  EnumConfig,
  StringConfig,
  NumberConfig,
  BooleanConfig,
  ArrayConfig,
  RecordConfig,
  ObjectConfig,
  AnyOfConfig,
} from "../../types/formTypes";
import dendronValidator from "../../data/dendron-yml.validator.json";

const { Title } = Typography;
const { Content } = Layout;

const generateSchema = (config: Config): any => {
  if (!config) return {};
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

  if (config.type === "anyOf") {
    return { anyOf: config.data.map(generateSchema) };
  }

  if (config.type === "record") {
    return {
      type: "object",
      patternProperties: {
        "^[sS]+$": {
          ...generateSchema(config.data),
        },
      },
    };
  }

  const schema: any = {
    type: "object",
    properties: Object.fromEntries(
      Object.keys(config.data).map((key) => [
        key,
        generateSchema((config as ObjectConfig).data[key]),
      ])
    ),
    required: Object.keys(config.data).filter(
      (key) => (config as ObjectConfig).data[key].required
    ),
  };
  return schema;
};

type DefaultProps = {
  engine: engineSlice.EngineState;
};

const generateRenderableConfig = (
  properties: any,
  definitions: any,
  label: string
): Config => {
  // `any` type generates empty config object, so we are assuming
  // that it's a string so that nothing breaks
  if (_.isEmpty(properties))
    return {
      type: "string",
      label,
    } as StringConfig;

  if (properties.type === "string") {
    return {
      type: "enum" in properties ? "enum" : "string",
      label,
      helperText: properties.description,
      data: "enum" in properties ? properties.enum : [],
    } as StringConfig | EnumConfig;
  }

  if (properties.type === "number" || properties.type === "boolean") {
    return {
      type: properties.type,
      helperText: properties.description,
      label,
    } as NumberConfig | BooleanConfig;
  }

  if (properties.type === "array") {
    return {
      type: properties.type,
      label,
      data: generateRenderableConfig(properties.items, definitions, ""),
    } as ArrayConfig;
  }

  if ("anyOf" in properties) {
    return {
      type: "anyOf",
      label,
      data: properties.anyOf.map((schema: any) =>
        generateRenderableConfig(schema, definitions, "")
      ),
    } as AnyOfConfig;
  }

  if ("$ref" in properties) {
    const src = properties.$ref.replace("#/definitions/", "");
    const data = _.get(definitions, src);
    return generateRenderableConfig(data, definitions, src);
  }

  if ("additionalProperties" in properties) {
    return {
      type: "record",
      label,
      data: generateRenderableConfig(
        properties.additionalProperties,
        definitions,
        ""
      ),
    } as RecordConfig;
  }

  return {
    type: "object",
    label,
    data: Object.fromEntries(
      Object.keys(properties.properties).map((key) => [
        key,
        generateRenderableConfig(properties.properties[key], definitions, key),
      ])
    ),
  } as ObjectConfig;
};

const ConfigForm: React.FC<DefaultProps> = ({ engine }) => {
  const [openKeys, setOpenKeys] = React.useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
  const [currentValues, setCurrentValues] = useState<any>({});
  const router = useRouter();
  const { ws, port } = router.query;
  const dispatch = engineHooks.useEngineAppDispatch();
  const ajv = useRef(new Ajv({ allErrors: true }));
  const dendronConfig = useMemo(
    () =>
      generateRenderableConfig(
        dendronValidator,
        dendronValidator.definitions,
        ""
      ),
    []
  );

  useEffect(() => {
    setCurrentValues(engine.config);
  }, [engine]);

  const schema: JSONSchemaType<any> = useMemo(
    () => (dendronConfig ? generateSchema(dendronConfig) : {}),
    [dendronConfig]
  );

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

  const onSubmit = async (config: any, { setSubmitting }: any) => {
    dispatch(
      configWrite({
        config,
        ws: ws as string,
        port: Number(port as string),
      })
    )
      .then(() => message.success("Saved!"))
      .catch((err) => message.error(err.message))
      .finally(() => {
        setSubmitting(false);
      });
  };

  const validate = (values: any) => {
    setCurrentValues(values);
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
        errors[`${instancePath.substring(1)}`.replace("/", ".")] = message;
      }
    });
    return errors;
  };

  if (!engine.config || !ws || !port) {
    return <></>;
  }

  return (
    <Layout
      style={{
        height: "100vh",
        overflowY: "hidden",
      }}
    >
      <SideMenu
        {...{
          openKeys,
          setOpenKeys,
          selectedKeys,
          setSelectedKeys,
          currentValues,
          dendronFormConfig: dendronConfig,
        }}
      />
      <Layout
        className="site-layout"
        style={{
          overflowY: "scroll",
          display: "flex",
          justifyItems: "center",
          alignItems: "center",
        }}
      >
        <Content
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "50rem",
          }}
        >
          <Typography style={{ textAlign: "center", padding: "2rem" }}>
            <Title>Dendron Configuration</Title>
          </Typography>
          <Formik
            initialValues={engine.config}
            onSubmit={onSubmit}
            validate={validate}
            validateOnChange={true}
          >
            {({ values, errors }) => (
              <Form {...formItemLayout}>
                <ConfigInput
                  data={dendronConfig}
                  values={values}
                  errors={errors}
                  prefix={[]}
                  setSelectedKeys={setSelectedKeys}
                />
                <Form.Item name="submit" style={{ justifyContent: "center" }}>
                  <Button.Group size="large">
                    <ResetButton type="text">Clear changes</ResetButton>
                    <SubmitButton type="primary" disabled={!_.isEmpty(errors)}>
                      Save changes
                    </SubmitButton>
                  </Button.Group>
                </Form.Item>
              </Form>
            )}
          </Formik>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ConfigForm;
