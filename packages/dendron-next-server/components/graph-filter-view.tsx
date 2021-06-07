import {
  Typography,
  Collapse,
  Switch,
  Space,
  InputNumber,
  Divider,
  Input,
} from "antd";
import _, { values } from "lodash";
import { GraphConfig } from "./graph";
const { Panel } = Collapse;

type FilterProps = {
  type: "note" | "schema";
  config: GraphConfig;
  setField: (key: string, value: any) => void;
};

const GraphFilterView = ({ type, config, setField }: FilterProps) => {
  const sections = new Set(Object.keys(config).map((key) => key.split(".")[0]));
  const configEntries = Object.entries(config);

  return (
    <div
      style={{
        position: "absolute",
        top: "1rem",
        left: "1rem",
        background: "#F5F6F8",
        borderRadius: 4,
        zIndex: 10,
        minWidth: "12rem",
      }}
    >
      <Collapse>
        {Array.from(sections).map((section, i) => (
          <Panel header={_.capitalize(section)} key={i}>
            <Space direction="vertical" style={{ width: "100%" }}>
              {configEntries
                .filter(([key]) => key.includes(section))
                .map(([key, entry]) => {
                  const keyArray = key.split(".");
                  const label =
                    entry?.label ||
                    `${_.capitalize(keyArray[keyArray.length - 1])}`;

                  return (
                    <Space
                      direction="horizontal"
                      style={{ justifyContent: "space-between", width: "100%" }}
                    >
                      {_.isBoolean(entry?.value) && (
                        <>
                          <Typography>{label}</Typography>
                          <Switch
                            checked={entry?.value}
                            onChange={(newValue) => setField(key, newValue)}
                            disabled={!entry?.mutable}
                          />
                        </>
                      )}
                      {_.isNumber(entry?.value) && (
                        <>
                          <Typography>{label}</Typography>
                          <InputNumber
                            defaultValue={entry?.value}
                            onChange={(newValue) => setField(key, newValue)}
                            disabled={!entry?.mutable}
                          />
                        </>
                      )}
                      {_.isString(entry?.value) && (
                        <>
                          <Typography>{label}</Typography>
                          <Input
                            defaultValue={entry?.value}
                            onChange={(newValue) =>
                              setField(key, newValue.target.value)
                            }
                            disabled={!entry?.mutable}
                          />
                        </>
                      )}
                    </Space>
                  );
                })}
            </Space>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

const FilterViewInput = () => {};

export default GraphFilterView;
