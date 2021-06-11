import { Typography, Collapse, Switch, Space, InputNumber, Input } from "antd";
import _, { values } from "lodash";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { GraphConfig } from "../lib/graph";
import AntThemes from "../styles/theme-antd";
const { Panel } = Collapse;

type FilterProps = {
  type: "note" | "schema";
  config: GraphConfig;
  setConfig: React.Dispatch<React.SetStateAction<GraphConfig>>;
};

const GraphFilterView = ({ config, setConfig }: FilterProps) => {
  const sections = new Set(Object.keys(config).map((key) => key.split(".")[0]));
  const configEntries = Object.entries(config);

  const { currentTheme } = useThemeSwitcher();

  const updateConfigField = (key: string, value: string | number | boolean) => {
    setConfig((c) => {
      const newConfig = {
        ...c,
        [key]: {
          // @ts-ignore
          ...c[key],
          value,
        },
      };
      return newConfig;
    });
  };

  if (!currentTheme) return <></>;

  return (
    <div
      style={{
        zIndex: 10,
        position: "absolute",
        top: AntThemes[currentTheme].graph.filterView.margin,
        left: AntThemes[currentTheme].graph.filterView.margin,
        background: AntThemes[currentTheme].graph.filterView.background,
        borderRadius: AntThemes[currentTheme].graph.filterView.borderRadius,
        minWidth: AntThemes[currentTheme].graph.filterView.minWidth,
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
                    `${keyArray[keyArray.length - 1]
                      .split("-")
                      .map((k) => _.capitalize(k))
                      .join(" ")}`;

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
                            onChange={(newValue) =>
                              updateConfigField(key, newValue)
                            }
                            disabled={!entry?.mutable}
                          />
                        </>
                      )}
                      {_.isNumber(entry?.value) && (
                        <>
                          <Typography>{label}</Typography>
                          <InputNumber
                            defaultValue={entry?.value}
                            onChange={(newValue) =>
                              updateConfigField(key, newValue)
                            }
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
                              updateConfigField(key, newValue.target.value)
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
