import { DendronProps } from "../../lib/types";
import { Form, Select, Switch } from "antd";
import {
  DMessageSource,
  LookupEffectTypeEnum,
  LookupFilterTypeEnum,
  LookupNoteTypeEnum,
  LookupSelectionType,
  LookupSelectionTypeEnum,
  LookupSplitTypeEnum,
  LookupViewMessage,
  LookupViewMessageEnum,
} from "@dendronhq/common-all";
import React from "react";
import { postVSCodeMessage } from "@dendronhq/common-frontend";

export default function Lookup({ ide }: DendronProps) {
  const [form] = Form.useForm();
  const { Option } = Select;
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

  const pressed = ide.lookupModifiers
    ? ide.lookupModifiers.filter((mod) => {
        return mod.pressed;
      })
    : [];

  const selectionModifierState = pressed.filter((mod) => {
    if (Object.keys(LookupSelectionTypeEnum).includes(mod.type)) {
      form.setFieldsValue({ selection: mod.type });
      return true;
    }
    return false;
  });

  const noteModifierState = pressed.filter((mod) => {
    if (Object.keys(LookupNoteTypeEnum).includes(mod.type)) {
      form.setFieldsValue({ note: mod.type });
      return true;
    }
    return false;
  });

  const effectModifierState = pressed.filter((mod) => {
    return Object.keys(LookupEffectTypeEnum).includes(mod.type);
  });

  form.setFieldsValue({ effect: effectModifierState.map((mod) => mod.type) });

  const isHorizontalSplit =
    pressed.filter((mod) => {
      return Object.keys(LookupSplitTypeEnum).includes(mod.type);
    }).length === 1;

  const isDirectChildOnly =
    pressed.filter((mod) => {
      return Object.keys(LookupFilterTypeEnum).includes(mod.type);
    }).length === 1;

  const onValuesChange = (changedValues: any, allValues: any) => {
    postVSCodeMessage({
      type: LookupViewMessageEnum.onValuesChange,
      data: { changedValues, allValues },
      source: DMessageSource.webClient,
    } as LookupViewMessage);
  };

  const selectionTypeOnChange = (opts?: LookupSelectionTypeEnum) => {
    console.log({ opts });
  };

  return (
    <>
      <h4>Modifiers</h4>
      <Form form={form}>
        <Form.Item name="selection" label="Selection">
          <Select
            allowClear
            onChange={selectionTypeOnChange}
            placeholder="None selected"
          >
            {selectionModifierChoices}
          </Select>
        </Form.Item>
        <Form.Item name="note" label="Note Type">
          <Select>{noteModifierChoices}</Select>
        </Form.Item>
        <Form.Item name="effect" label="Effect Type">
          <Select mode="multiple">{effectModifierChoices}</Select>
        </Form.Item>
        <Form.Item name="horizontalSplit" label="Split Horizontally">
          <Switch checked={isHorizontalSplit} />
        </Form.Item>
        <Form.Item name="directChildOnly" label="Apply Direct Child Filter">
          <Switch checked={isDirectChildOnly} />
        </Form.Item>
      </Form>
    </>
  );
}
