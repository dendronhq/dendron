import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { Formik, FieldArray } from "formik";
import { useThemeSwitcher } from "react-css-theme-switcher";
import _ from "lodash";
import React from "react";
import { Button, List } from "antd";
import { DendronConfig } from "@dendronhq/common-all";
import { Form, Input, InputNumber, Checkbox, Field } from 'formik-antd'
import { Typography, Divider } from 'antd';
const { Title, Paragraph, Text, Link } = Typography;

const createFormItem = ({name, label}: { name: string, placeholder?: string, label: string }) => {
    return <Form.Item
        name={name}
        label={label}
    >
        <Input name={name} />
    </Form.Item>

}

const renderArray = (arrayEnts: any[], arrayHelpers: any) => {
    const data = arrayEnts.map((_ent, idx) => (
        <>
            <Field
                key={idx}
                name={`site.siteHierarchies.${idx}`}
            />
            <button
                type="button"
                onClick={() => arrayHelpers.remove(idx)}
            >
                -
            </button>
        </>)).concat(
            <button
                type="button"
                onClick={() => arrayHelpers.push("")}
            >
                +
                              </button>

        );
    return <List
    itemLayout="vertical"
    dataSource={data}
    bordered={false}
    renderItem={item => (
      <List.Item style={{borderBottom:'none'}}>
          {item}
      </List.Item>
    )}
  />

}

export default function Config({
    engine,
}: {
    engine: engineSlice.EngineState;
}) {
    const logger = createLogger("Config");
    if (!engine.config) {
        return <></>
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
        <Formik initialValues={engine.config}
            onSubmit={() => {

            }}>
            {({ handleSubmit, handleChange, handleBlur, values, errors }) => (
                <Form
                    {...formItemLayout}
                >
                    <Typography>
                        <Title>Publishing </Title>
                    </Typography>

                    <Form.Item
                        name="siteHierarchies"
                        label="Site Hierarchies"
                    >

                        <FieldArray
                            name="site.siteHierarchies"
                            render={(arrayHelpers) => (renderArray(values.site.siteHierarchies, arrayHelpers))} />
                    </Form.Item>
                    {createFormItem({name: "site.siteRootDir", label: "Site Root Dir"})}
                </Form>
            )}
        </Formik>
    )
}

