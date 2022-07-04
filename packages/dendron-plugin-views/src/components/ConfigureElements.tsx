import {
  Input,
  InputNumber,
  Checkbox,
  Select,
  List,
  Button,
  Typography,
} from "antd";
import { debounce } from "lodash";
import React, { useEffect, useState } from "react";
import { Config } from "../utils/dendronConfig";
import "antd/dist/antd.css";
import { DeleteOutlined } from "@ant-design/icons";

type ConfigureElementProps = Config & {
  postMessage: ({ key, value }: { key: string; value: string }) => void;
  name: string;
};

const ConfigureElement = (props: ConfigureElementProps) => {
  const { Option } = Select;
  const { name, postMessage } = props;

  const handleSelectChange = debounce((e: any, name: string) => {
    postMessage({ key: name, value: e });
  }, 500);
  const handleInputChange = debounce((e: any) => {
    postMessage({ key: e.target.name, value: e.target.value });
  }, 500);
  const handleCheckboxChange = debounce((e: any) => {
    postMessage({ key: e.target.name, value: e.target.checked });
  }, 500);

  switch (props.type) {
    case "number":
      return (
        <InputNumber
          name={name}
          defaultValue={props.default}
          onChange={(e) => handleSelectChange(e, props.name)}
        />
      );
    case "boolean":
      return (
        <Checkbox
          name={name}
          defaultChecked={props.default}
          onChange={handleCheckboxChange}
        >
          {props.description}
        </Checkbox>
      );
    case "string":
      return (
        <Input
          name={name}
          defaultValue={props.default}
          onChange={handleInputChange}
        />
      );
    case "enum":
      return (
        <Select
          style={{ width: "100%" }}
          defaultValue={props.default}
          onChange={(e) => handleSelectChange(e, props.name)}
        >
          {props.enum?.map((val: any) => (
            <Option value={val}>{val}</Option>
          ))}
        </Select>
      );
    case "array":
      return <ArrayConfig {...props} />;
    default:
      return <></>;
  }
};

const ArrayConfig = (props: any) => {
  const [listItems, setListItems] = useState(props.default || []);
  const [addItems, setAddItems] = useState("");
  const deleteItem = (item: string) => {
    setListItems(listItems.filter((data: string) => data !== item));
  };

  const handleChange = (e: any) => {
    e.target.value && setAddItems(e.target.value);
  };

  const addItem = () => {
    setListItems([...listItems, addItems]);
    setAddItems("");
  };

  useEffect(() => {
    props.postMessage({ key: props.name, value: listItems });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listItems]);

  return (
    <>
      {listItems.length > 0 && (
        <List
          itemLayout="vertical"
          dataSource={listItems as string[]}
          bordered
          size="small"
          renderItem={(item) => (
            <List.Item
              key={item}
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography.Paragraph>{item}</Typography.Paragraph>
              <Button
                icon={<DeleteOutlined />}
                onClick={() => deleteItem(item)}
              />
            </List.Item>
          )}
        />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
        }}
      >
        <Input
          value={addItems}
          style={{ width: "75%" }}
          onChange={handleChange}
        ></Input>
        <Button onClick={addItem}>Add Item</Button>
      </div>
    </>
  );
};

export default ConfigureElement;
