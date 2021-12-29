import { DendronProps } from "../types";
import { Form, Select, Switch, FormInstance } from "antd";
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
import { postVSCodeMessage } from "../utils/vscode";
import { ideSlice } from "@dendronhq/common-frontend";

const { Option } = Select;

export default function DendronLookupPanel({ ide }: DendronProps) {
  const [form] = Form.useForm();

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

  return (
    <>
      <h4>Modifiers</h4>
      <LookupViewForm ide={ide} form={form} />
    </>
  );
}

function LookupViewForm({
  ide,
  form,
}: {
  ide: ideSlice.IDEState;
  form: FormInstance;
}) {
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
      <Form form={form}>
        <SelectionTypeFormItem />
        <NoteTypeFormItem />
        <EffectTypeFormItem />
        <SplitTypeFormItem />
        <FilterTypeFormItem />
      </Form>
    </>
  );
}

function SelectionTypeFormItem() {
  const onSelectionChange = (option: string) => {
    postVSCodeMessage({
      type: LookupViewMessageEnum.onValuesChange,
      data: { category: "selection", type: option },
      source: DMessageSource.webClient,
    });
  };
  const selectionModifierChoices = Object.keys(LookupSelectionTypeEnum)
    .filter((key) => key !== "none")
    .map((key) => {
      return <Option value={key}>{key}</Option>;
    });

  return (
    <>
      <Form.Item name="selection" label="Selection">
        <Select allowClear onChange={onSelectionChange} placeholder="None">
          {selectionModifierChoices}
        </Select>
      </Form.Item>
    </>
  );
}

function NoteTypeFormItem() {
  const onNoteChange = (option: string) => {
    postVSCodeMessage({
      type: LookupViewMessageEnum.onValuesChange,
      data: { category: "note", type: option },
      source: DMessageSource.webClient,
    });
  };
  const noteModifierChoices = Object.keys(LookupNoteTypeEnum).map((key) => {
    return <Option value={key}>{key}</Option>;
  });
  return (
    <>
      <Form.Item name="note" label="Note Type">
        <Select allowClear onChange={onNoteChange} placeholder="None">
          {noteModifierChoices}
        </Select>
      </Form.Item>
    </>
  );
}

function EffectTypeFormItem() {
  const effectModifierChoices = Object.keys(LookupEffectTypeEnum).map((key) => {
    return <Option value={key}>{key}</Option>;
  });
  const onEffectChange = (option: string) => {
    postVSCodeMessage({
      type: LookupViewMessageEnum.onValuesChange,
      data: { category: "effect", type: option },
      source: DMessageSource.webClient,
    });
  };
  return (
    <>
      <Form.Item name="effect" label="Effect Type">
        <Select
          allowClear
          mode="multiple"
          onChange={onEffectChange}
          placeholder="None"
        >
          {effectModifierChoices}
        </Select>
      </Form.Item>
    </>
  );
}

function SplitTypeFormItem() {
  const onSplitChange = (checked: boolean) => {
    postVSCodeMessage({
      type: LookupViewMessageEnum.onValuesChange,
      data: { category: "split", type: "horizontal", checked },
      source: DMessageSource.webClient,
    });
  };
  return (
    <>
      <Form.Item
        name="horizontalSplit"
        label="Split Horizontally"
        valuePropName="checked"
      >
        <Switch onChange={onSplitChange} />
      </Form.Item>
    </>
  );
}

function FilterTypeFormItem() {
  const onFilterChange = (checked: boolean) => {
    postVSCodeMessage({
      type: LookupViewMessageEnum.onValuesChange,
      data: { category: "filter", type: "directChildOnly", checked },
      source: DMessageSource.webClient,
    });
  };
  return (
    <>
      <Form.Item
        name="directChildOnly"
        label="Apply Direct Child Filter"
        valuePropName="checked"
      >
        <Switch onChange={onFilterChange} />
      </Form.Item>
    </>
  );
}
