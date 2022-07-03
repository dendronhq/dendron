import { Input, InputNumber, Checkbox, Select, Card, Typography } from "antd";
import { debounce } from "lodash";
import React from "react";

const ConfigureElement = (props: any) => {
  const { Option } = Select;
  const { Paragraph } = Typography;

  const handleSelectChange = debounce(async (e: any, name: string) => {
    props.postMessage({ key: name, value: e });
  }, 500);
  const handleInputChange = debounce(async (e: any) => {
    props.postMessage({ key: e.target.name, value: e.target.value });
  }, 500);
  const handleCheckboxChange = debounce(async (e: any) => {
    props.postMessage({ key: e.target.name, value: e.target.checked });
  }, 500);

  switch (props.type) {
    case "number":
      return (
        <InputNumber
          name={`${props.parentLabel}.${props.label}`}
          defaultValue={props.default}
          onChange={(e) =>
            handleSelectChange(e, `${props.parentLabel}.${props.label}`)
          }
        />
      );
    case "boolean":
      return (
        <Checkbox
          name={`${props.parentLabel}.${props.label}`}
          defaultChecked={props.default}
          onChange={handleCheckboxChange}
        >
          {props.label}
        </Checkbox>
      );
    case "string":
      return (
        <Input
          name={`${props.parentLabel}.${props.label}`}
          defaultValue={props.default}
          onChange={handleInputChange}
        />
      );
    case "enum":
      return (
        <Select
          style={{ width: "100%" }}
          defaultValue={props.default}
          onChange={(e) =>
            handleSelectChange(e, `${props.parentLabel}.${props.label}`)
          }
        >
          {props.enum.map((val: any) => (
            <Option value={val}>{val}</Option>
          ))}
        </Select>
      );
    case "object":
      return props.children.map((child: any) => (
        <Card type="inner" title={child.label}>
          <Paragraph>{child.description ? child.description : null}</Paragraph>
          <ConfigureElement
            {...child}
            parentLabel={`${props.parentLabel}.${props.label}`}
            postMessage={props.postMessage}
          />
        </Card>
      ));
    default:
      return <></>;
  }
};

export default ConfigureElement;
