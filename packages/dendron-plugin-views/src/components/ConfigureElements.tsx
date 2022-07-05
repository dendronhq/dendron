import {
  Input,
  InputNumber,
  Checkbox,
  Select,
  List,
  Button,
  Typography,
  Table,
} from "antd";
import { debounce } from "lodash";
import React, { useState } from "react";
import { Config } from "../utils/dendronConfig";
import "antd/dist/antd.css";
import { DeleteOutlined } from "@ant-design/icons";
import { postVSCodeMessage } from "../utils/vscode";
import {
  ConfigureUIMessage,
  ConfigureUIMessageEnum,
  DMessageSource,
} from "@dendronhq/common-all";

type ConfigureElementProps = Config & {
  postMessage: ({ key, value }: { key: string; value: any }) => void;
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

  const handleLink = () => {
    postVSCodeMessage({
      type: ConfigureUIMessageEnum.openDendronConfigYaml,
      source: DMessageSource.webClient,
    } as ConfigureUIMessage);
  };

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
      return <ListView {...props} />;
    case "list":
      return <TableView {...props} />;

    case "object":
      return (
        <Typography.Link onClick={handleLink}>
          Edit in dendron.yml
        </Typography.Link>
      );
    default:
      return <></>;
  }
};

const ListView = (props: ConfigureElementProps) => {
  const [listItems, setListItems] = useState(props.default || []);
  const [addItems, setAddItems] = useState("");
  const deleteListItem = (item: string) => {
    const newListItems = listItems.filter((data: string) => data !== item);
    setListItems(newListItems);
    props.postMessage({ key: props.name, value: newListItems });
  };

  const handleChange = (e: any) => {
    e.target.value && setAddItems(e.target.value);
  };

  const addItem = () => {
    const newListItems = [...listItems, addItems];
    setListItems(newListItems);
    props.postMessage({ key: props.name, value: newListItems });
    setAddItems("");
  };

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
                onClick={() => deleteListItem(item)}
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

const TableView = (props: ConfigureElementProps) => {
  const items = Object.keys(props.default).map((key) => {
    return { key: key, value: props.default[key] };
  });

  const [tableItems, setTableItems] = useState(items || []);

  const handleDelete = (key: string) => {
    const newTableItems = tableItems.filter((data) => data.key !== key);
    setTableItems(newTableItems);
    const value: { [key: string]: string } = {};
    newTableItems.forEach((item) => (value[item.key] = item.value));
    props.postMessage({ key: props.name, value: value });
  };

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
    },
    {
      title: "Value",
      dataIndex: "value",
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: { key: string }) =>
        tableItems.length >= 1 ? (
          <DeleteOutlined onClick={() => handleDelete(record.key)} />
        ) : null,
    },
  ];

  return (
    <>
      {tableItems.length > 0 && (
        <Table
          size="small"
          pagination={false}
          dataSource={tableItems}
          columns={columns}
        />
      )}
    </>
  );
};

export default ConfigureElement;
