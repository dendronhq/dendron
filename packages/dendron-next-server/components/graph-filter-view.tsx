import {
  Typography,
  Collapse,
  Switch,
  Space,
  InputNumber,
  Input,
  Spin,
  Tooltip,
  Button,
} from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import _ from "lodash";
import React, { useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { GraphConfig, GraphConfigItem } from "../lib/graph";
import AntThemes from "../styles/theme-antd";

const { Panel } = Collapse;

type FilterProps = {
  config: GraphConfig;
  setConfig: React.Dispatch<React.SetStateAction<GraphConfig>>;
  isGraphLoaded: boolean;
};

const GraphFilterView = ({ config, setConfig, isGraphLoaded }: FilterProps) => {
  const sortedSections = [
    "vaults",
    "connections",
    "filter",
    "options",
    "information",
  ];

  const [showView, setShowView] = useState(false);
  const { currentTheme } = useThemeSwitcher();

  const isVisible = showView && isGraphLoaded;

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
    <Space
      direction="vertical"
      style={{
        zIndex: 10,
        position: "absolute",
        top: AntThemes[currentTheme].graph.filterView.margin,
        left: AntThemes[currentTheme].graph.filterView.margin,
        borderRadius: AntThemes[currentTheme].graph.filterView.borderRadius,
        minWidth: AntThemes[currentTheme].graph.filterView.minWidth,
      }}
    >
      <Tooltip
        title={`${isVisible ? "Hide" : "Show"} Graph Configuration`}
        placement="right"
      >
        <Button
          type="primary"
          shape="circle"
          icon={isVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setShowView((v) => !v)}
          style={{
            opacity: isGraphLoaded ? 1 : 0,
            transform: "0.2s opacity ease-in-out",
          }}
        />
      </Tooltip>
      <Collapse
        style={{
          background: AntThemes[currentTheme].graph.filterView.background,
          display: isVisible ? "block" : "none",
        }}
      >
        <Panel header="Vaults" key="vaults">
          <FilterViewSection
            section="vaults"
            config={config}
            updateConfigField={updateConfigField}
          />
        </Panel>
        <Panel header="Connections" key="connections">
          <FilterViewSection
            section="connections"
            config={config}
            updateConfigField={updateConfigField}
          />
        </Panel>
        <Panel header="Filter" key="filter">
          <FilterViewSection
            section="filter"
            config={config}
            updateConfigField={updateConfigField}
          />
        </Panel>
        <Panel header="Options" key="options">
          <FilterViewSection
            section="options"
            config={config}
            updateConfigField={updateConfigField}
          />
        </Panel>
        <Panel header="Information" key="information">
          <FilterViewSection
            section="information"
            config={config}
            updateConfigField={updateConfigField}
          />
        </Panel>
      </Collapse>
    </Space>
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
              display: updateTimeout ? "inline-block" : "none",
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

const FilterViewSection = ({
  section,
  config,
  updateConfigField,
}: {
  section: string;
  config: GraphConfig;
  updateConfigField: (key: string, value: string | number | boolean) => void;
}) => {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {Object.entries(config)
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
              key={key}
            >
              {_.isBoolean(entry?.value) && (
                <>
                  <Typography>{label}</Typography>
                  <Switch
                    checked={entry?.value}
                    onChange={(newValue) => updateConfigField(key, newValue)}
                    disabled={!entry?.mutable}
                  />
                </>
              )}
              {_.isNumber(entry?.value) && (
                <>
                  <Typography>{label}</Typography>
                  <InputNumber
                    value={entry?.value}
                    onChange={(newValue) => updateConfigField(key, newValue)}
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
  );
};

export default GraphFilterView;
