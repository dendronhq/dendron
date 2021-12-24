import { DendronProps } from "../../lib/types";
import { Form, Select, Switch } from "antd";
import {
  DMessageSource,
  LookupEffectTypeEnum,
  LookupFilterTypeEnum,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  LookupSplitTypeEnum,
  LookupViewMessage,
  LookupViewMessageEnum,
} from "@dendronhq/common-all";
import React, { useEffect } from "react";
import { postVSCodeMessage } from "@dendronhq/common-frontend";

export default function Lookup({ ide }: DendronProps) {
  const [form] = Form.useForm();
  const { Option } = Select;

  // set up choices for form.
  const selectionModifierChoices = Object.keys(LookupSelectionTypeEnum)
    .filter((key) => key !== "none")
    .map((key) => {
      return <Option value={key}>{key}</Option>;
    });
  const noteModifierChoices = Object.keys(LookupNoteTypeEnum).map((key) => {
    return <Option value={key}>{key}</Option>;
  });
  const effectModifierChoices = Object.keys(LookupEffectTypeEnum).map((key) => {
    return <Option value={key}>{key}</Option>;
  });

  const onChange = (category: "selection" | "note" | "effect") => {
    return (option: string) => {
      postVSCodeMessage({
        type: LookupViewMessageEnum.onValuesChange,
        data: { category, type: option },
        source: DMessageSource.webClient,
      });
    };
  };

  const onSplitChange = (checked: boolean) => {
    postVSCodeMessage({
      type: LookupViewMessageEnum.onValuesChange,
      data: { category: "split", type: "horizontal", checked },
      source: DMessageSource.webClient,
    });
  };

  const onFilterChange = (checked: boolean) => {
    postVSCodeMessage({
      type: LookupViewMessageEnum.onValuesChange,
      data: { category: "filter", type: "directChildOnly", checked },
      source: DMessageSource.webClient,
    });
  };

  // on each render
  useEffect(() => {
    // ask vscode for controller state if it's not set yet.
    if (ide.lookupModifiers === undefined) {
      postVSCodeMessage({
        type: LookupViewMessageEnum.onRequestControllerState,
        data: {},
        source: DMessageSource.webClient,
      } as LookupViewMessage);
    }
  });

  const pressed = ide.lookupModifiers
    ? ide.lookupModifiers.filter((mod) => {
        return mod.pressed;
      })
    : [];

  // update selection type form
  const selectionTypeState = pressed.filter((mod) => {
    if (Object.keys(LookupSelectionTypeEnum).includes(mod.type)) {
      form.setFieldsValue({ selection: mod.type });
      return true;
    }
    return false;
  });

  if (selectionTypeState.length === 0) {
    form.setFieldsValue({ selection: undefined });
  }

  // update note type form
  const noteTypeState = pressed.filter((mod) => {
    if (Object.keys(LookupNoteTypeEnum).includes(mod.type)) {
      form.setFieldsValue({ note: mod.type });
      return true;
    }
    return false;
  });

  if (noteTypeState.length === 0) {
    form.setFieldsValue({ note: undefined });
  }

  // update effect type form
  form.setFieldsValue({
    effect: pressed
      .filter((mod) => {
        return Object.keys(LookupEffectTypeEnum).includes(mod.type);
      })
      .map((mod) => mod.type),
  });

  // update horizontal split switch
  form.setFieldsValue({
    horizontalSplit:
      pressed.filter((mod) => {
        return Object.keys(LookupSplitTypeEnum).includes(mod.type);
      }).length === 1,
  });

  // update direct child only switch
  form.setFieldsValue({
    directChildOnly:
      pressed.filter((mod) => {
        return Object.keys(LookupFilterTypeEnum).includes(mod.type);
      }).length === 1,
  });

  return (
    <>
      <h4>Modifiers</h4>
      <Form form={form}>
        <Form.Item name="selection" label="Selection">
          <Select
            allowClear
            onChange={onChange("selection")}
            placeholder="None"
          >
            {selectionModifierChoices}
          </Select>
        </Form.Item>
        <Form.Item name="note" label="Note Type">
          <Select allowClear onChange={onChange("note")} placeholder="None">
            {noteModifierChoices}
          </Select>
        </Form.Item>
        <Form.Item name="effect" label="Effect Type">
          <Select
            allowClear
            mode="multiple"
            onChange={onChange("effect")}
            placeholder="None"
          >
            {effectModifierChoices}
          </Select>
        </Form.Item>
        <Form.Item
          name="horizontalSplit"
          label="Split Horizontally"
          valuePropName="checked"
        >
          <Switch onChange={onSplitChange} />
        </Form.Item>
        <Form.Item
          name="directChildOnly"
          label="Apply Direct Child Filter"
          valuePropName="checked"
        >
          <Switch onChange={onFilterChange} />
        </Form.Item>
      </Form>
    </>
  );
}
