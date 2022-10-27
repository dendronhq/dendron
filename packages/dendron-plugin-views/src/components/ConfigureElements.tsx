import {
  Input,
  InputNumber,
  Checkbox,
  Select,
  List,
  Button,
  Typography,
  Table,
  Form,
} from "antd";
import { debounce } from "lodash";
import { useState } from "react";
import { Config } from "../utils/dendronConfig";
import "antd/dist/antd.css";
import { DeleteOutlined } from "@ant-design/icons";
import { postVSCodeMessage } from "../utils/vscode";
import {
  ConfigureUIMessage,
  ConfigureUIMessageEnum,
  ConfigUtils,
  DMessageSource,
} from "@dendronhq/common-all";

type ConfigureElementProps = Config & {
  postMessage: ({ key, value }: { key: string; value: any }) => void;
  name: string;
};

const ConfigureElement = (props: ConfigureElementProps) => {
  const { Option } = Select;
  const { name, postMessage } = props;

  const handleSelectChange = (e: any, name: string) => {
    postMessage({ key: name, value: e });
  };
  const handleInputChange = debounce((e: any) => {
    postMessage({ key: e.target.name, value: e.target.value });
  }, 500);
  const handleCheckboxChange = (e: any) => {
    postMessage({ key: e.target.name, value: e.target.checked });
  };

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
          {ConfigUtils.getConfigDescription(name)}
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
    case "select":
      return (
        <Select
          style={{ width: "100%" }}
          defaultValue={props.default}
          onChange={(e) => handleSelectChange(e, props.name)}
        >
          {props.enum?.map((val: any) => (
            <Option key={val} value={val}>
              {val}
            </Option>
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
    if (e.target.value) {
      setAddItems(e.target.value);
    }
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
        />
        <Button onClick={addItem}>Add Item</Button>
      </div>
    </>
  );
};

const TableView = (props: ConfigureElementProps) => {
  type TableItems = {
    key: string;
    value: any;
  };
  const [form] = Form.useForm();
  const items: TableItems[] = Object.keys(props.default).map((key) => {
    return { key, value: props.default[key] };
  });

  const sendMessage = (newTableItems: TableItems[]) => {
    const value: { [key: string]: string } = {};
    newTableItems.forEach((item) => {
      value[item.key] = item.value;
    });
    props.postMessage({ key: props.name, value });
  };

  const [tableItems, setTableItems] = useState(items || []);
  const handleRowAdd = (row: { key: string; value: any }) => {
    const newRow = { key: row.key, value: row.value };
    const newTableItems = [...tableItems, newRow];
    setTableItems(newTableItems);
    form.resetFields();

    sendMessage(newTableItems);
  };
  const handleDelete = (key: string) => {
    const newTableItems = tableItems.filter((data) => data.key !== key);
    setTableItems(newTableItems);
    sendMessage(newTableItems);
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
        <>
          <Table
            size="small"
            pagination={false}
            dataSource={tableItems}
            columns={columns}
          />
          <Form
            form={form}
            name="basic"
            autoComplete="off"
            onFinish={handleRowAdd}
            style={{ display: "flex", paddingTop: "10px" }}
          >
            <Form.Item
              name="key"
              style={{ padding: "5px" }}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="value"
              style={{ padding: "5px" }}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item style={{ padding: "5px" }}>
              <Button htmlType="submit" type="primary">
                Add
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </>
  );
};

export default ConfigureElement;
