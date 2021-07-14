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
import FormGenerator from "../../components/formRenderer";
import SideMenu from "../../components/sideMenu";
import dendronValidator from "../../data/dendron-yml.validator.json";
import bucketConfig, { buckets } from "../../data/bucketConfig";
import {
  generateSchema,
  generateRenderableConfig,
} from "../../utils/formUtils";

const { Title } = Typography;
const { Content } = Layout;

type DefaultProps = {
  engine: engineSlice.EngineState;
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
        _.get(
          dendronValidator.definitions,
          dendronValidator.$ref.split("/").pop() as string
        ),
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

    console.log({ ajvErrors });

    if (!ajvErrors?.length) {
      return {};
    }

    ajvErrors?.forEach((error) => {
      const { instancePath, message } = error;
      if (instancePath !== "") {
        errors[`${instancePath.substring(1)}`.replace("/", ".")] = message;
      }
    });
    console.log({ errors });
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
          background: "white",
        }}
      >
        <Content
          style={{
            display: "flex",
            flexDirection: "column",
            width: "max-content",
            maxWidth: "35rem",
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
              <Form>
                {buckets.map((bucket) =>
                  bucketConfig[bucket].map((property: string) => (
                    <FormGenerator
                      data={generateRenderableConfig(
                        _.get(
                          dendronValidator,
                          `definitions.DendronConfig.properties.${property}`
                        ),
                        dendronValidator.definitions,
                        property
                      )}
                      values={values}
                      errors={errors}
                      prefix={[property]}
                      setSelectedKeys={setSelectedKeys}
                    />
                  ))
                )}
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
