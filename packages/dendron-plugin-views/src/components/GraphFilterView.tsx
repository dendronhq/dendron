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
  Radio,
} from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import _ from "lodash";
import { useState } from "react";
import { GraphConfig, GraphConfigItem } from "../utils/graph";
import AntThemes from "../styles/theme-antd";
import { useCurrentTheme } from "../hooks";
import { postVSCodeMessage } from "../utils/vscode";
import {
  DMessageSource,
  GraphThemeEnum,
  GraphViewMessage,
  GraphViewMessageEnum,
} from "@dendronhq/common-all";
import { ideHooks, ideSlice } from "@dendronhq/common-frontend";

const { Panel } = Collapse;

type FilterProps = {
  // type: "note" | "schema";
  config: GraphConfig;
  updateConfigField: (key: string, value: string | number | boolean) => void;
  isGraphReady: boolean;
  customCSS?: string;
  type?: "note" | "schema";
};

const GraphFilterView = ({
  config,
  updateConfigField,
  isGraphReady,
  customCSS,
  type,
}: FilterProps) => {
  const [showView, setShowView] = useState(false);
  const { currentTheme } = useCurrentTheme();

  if (!currentTheme) return <></>;
  const isVisible = showView && isGraphReady;

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
            opacity: isGraphReady ? 1 : 0,
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
        {type === "note" && (
          <Panel header="Graph Theme" key="graphTheme">
            <FilterViewSection
              section="graphTheme"
              config={config}
              updateConfigField={updateConfigField}
              customCSS={customCSS}
            />
          </Panel>
        )}
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
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

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
  customCSS,
}: {
  section: string;
  config: GraphConfig;
  updateConfigField: (key: string, value: string | number | boolean) => void;
  customCSS?: string;
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
              {_.isString(entry.value) && entry.singleSelect && (
                <>
                  <RadioButton
                    value={entry.value as GraphThemeEnum}
                    customCSS={customCSS}
                  />
                  <Button
                    type="primary"
                    size="small"
                    onClick={configureCustomStyling}
                    style={{
                      transform: "0.2s opacity ease-in-out",
                    }}
                  >
                    {customCSS ? "Modify custom css" : "Create Your Own"}
                  </Button>
                </>
              )}
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
                !_.isUndefined(key) &&
                !entry.singleSelect && (
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

const RadioButton = ({
  value,
  customCSS,
}: {
  value: GraphThemeEnum;
  customCSS?: string;
}) => {
  let singleSelectOptions = Object.keys(GraphThemeEnum).map(
    (k) => GraphThemeEnum[k as GraphThemeEnum]
  );
  if (!customCSS) {
    singleSelectOptions = singleSelectOptions.filter(
      (option) => option !== GraphThemeEnum.Custom
    );
  }
  const ideDispatch = ideHooks.useIDEAppDispatch();
  return (
    <Radio.Group
      onChange={(e) => {
        updateGraphTheme(e.target.value);
        ideDispatch(ideSlice.actions.setGraphTheme(e.target.value));
      }}
      value={value}
    >
      <Space direction="vertical">
        {singleSelectOptions.map((option) => (
          <Radio key={option} value={option}>
            {option}
          </Radio>
        ))}
      </Space>
    </Radio.Group>
  );
};

/**
 * vscode message to update graphTheme selected by User.
 * When the graph panel is disposed, this value is written back to Metadata Service.
 * @param graphTheme
 */
const updateGraphTheme = (graphTheme: GraphThemeEnum) => {
  postVSCodeMessage({
    type: GraphViewMessageEnum.onGraphThemeChange,
    data: { graphTheme },
    source: DMessageSource.webClient,
  } as GraphViewMessage);
};

const configureCustomStyling = () => {
  postVSCodeMessage({
    type: GraphViewMessageEnum.configureCustomStyling,
    source: DMessageSource.webClient,
  } as GraphViewMessage);
};

export default GraphFilterView;
