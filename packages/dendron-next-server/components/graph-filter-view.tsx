import {
  Typography,
  Collapse,
  Switch,
  Space,
  InputNumber,
  Input,
  Spin,
} from "antd";
import _ from "lodash";
import { useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { GraphConfig, GraphConfigItem } from "../lib/graph";
import AntThemes from "../styles/theme-antd";
const { Panel } = Collapse;

type FilterProps = {
  type: "note" | "schema";
  config: GraphConfig;
  setConfig: React.Dispatch<React.SetStateAction<GraphConfig>>;
  isVisible: boolean;
};

const GraphFilterView = ({ config, setConfig, isVisible }: FilterProps) => {
  const configEntries = Object.entries(config);
  const sortedSections = [
    "vaults",
    "connections",
    "filter",
    "options",
    "information",
  ];

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
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.2s",
      }}
    >
      <Collapse>
        {sortedSections.map((section, i) => (
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
                      {_.isString(entry?.value) &&
                        !_.isUndefined(entry) &&
                        !_.isUndefined(key) && (
                          <>
                            <FilterViewStringInput
                              fieldKey={key}
                              label={label}
                              entry={entry as GraphConfigItem<string>}
                              updateConfigField={updateConfigField}
                              nodeCount={config["information.nodes"].value}
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

const FilterViewStringInput = ({
  fieldKey,
  label,
  entry,
  updateConfigField,
  nodeCount,
}: {
  fieldKey: string;
  label: string;
  entry: GraphConfigItem<string>;
  updateConfigField: (key: string, value: string | number | boolean) => void;
  nodeCount: number;
}) => {
  const [updateTimeout, setUpdateTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // This timeout is designed to maximize filter responsiveness while minimizing hang times
  const handleChange = (newValue: string) => {
    const delay = nodeCount < 100 ? 0 : 400;

    if (updateTimeout) clearTimeout(updateTimeout);

    setUpdateTimeout(
      setTimeout(() => {
        updateConfigField(fieldKey, newValue);

        setUpdateTimeout(null);
      }, delay)
    );
  };

  return (
    <Space direction="vertical" style={{ margin: "0.5rem 0rem" }}>
      <Typography>{label}</Typography>
      <Input
        defaultValue={entry.value}
        onChange={(newValue) => handleChange(newValue.target.value)}
        disabled={!entry.mutable}
        placeholder={entry.placeholder || ""}
        suffix={
          <Spin
            size="small"
            style={{
              display: !!updateTimeout ? "inline-block" : "none",
            }}
          />
        }
        style={{
          maxWidth: 200,
        }}
      />
    </Space>
  );
};

export default GraphFilterView;
