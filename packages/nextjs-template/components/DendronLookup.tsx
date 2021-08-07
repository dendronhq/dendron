import { NoteIndexProps, NoteProps } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-frontend";
import { AutoComplete } from "antd";
import _ from "lodash";
import React from "react";
import { DendronLookupProps, useDendronLookup } from "../utils/hooks";
import { DendronCommonProps, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";
const { Option } = AutoComplete;

export function DendronLookup(props: DendronCommonProps) {
  const logger = createLogger("DendronLookup");
  // --- Hooks
  const [isModalVisible, setIsModalVisible] = React.useState<boolean>(false);
  const lookup = useDendronLookup();
  logger.info({ state: "enter", lookup });

  // --- Presentation
  if (!verifyNoteData(props)) {
    return <DendronSpinner />;
  }

  // --- Methods
  const onClick = (noteActive: NoteProps) => {
    console.log("BOND: onclickCalled");
    window.CommandBar.execute(3724);
    window.CommandBar.open(noteActive.fname);
    return undefined;
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // --- Logic
  const { dendronRouter, notes } = props;
  const noteActive = notes[dendronRouter.query.id];
  return <AntDAutoComplete lookup={lookup} {...props} />;
  // return (
  //   <>
  //     <Input placeholder="Lookup" onClick={showModal} />
  //     <Modal
  //       title="Basic Modal"
  //       visible={isModalVisible}
  //       onOk={handleOk}
  //       onCancel={handleCancel}
  //     >
  //       <AntDAutoComplete lookup={lookup} />
  //     </Modal>
  //   </>
  // );
}


type AntDOnSelect = Parameters<typeof AutoComplete>["0"]["onSelect"]
function AntDAutoComplete(
  props: { lookup: DendronLookupProps } & DendronCommonProps
) {
  const logger = createLogger("AntDAutoComplete");
  const [value, setValue] = React.useState("");
  const [result, setResult] = React.useState<NoteIndexProps[]>([]);
  const { lookup, dendronRouter } = props;
  const onSearch = (qs: string) => {
    logger.info({ state: "onSearch:enter", qs });
    const out = lookup?.queryNote({ qs });
    setResult(_.isUndefined(out) ? [] : out);
  };
  const onSelect: AntDOnSelect = (noteId, option) => {
    logger.info({state: "onSelect", noteId, option})
    const id = option.key?.toString()!
    dendronRouter.changeActiveNote(id);
  };
  const onChange = (data: string) => {
    setValue(data);
  };
  return (
    <AutoComplete
      value={value}
      style={{ width: 200 }}
      onSelect={onSelect}
      onSearch={onSearch}
      onChange={onChange}
      placeholder="input here"
    >
      {result.map((noteIndex: NoteIndexProps) => (
        <Option key={noteIndex.id} value={noteIndex.fname} >
          <div>{noteIndex.fname}</div>
        </Option>
      ))}
    </AutoComplete>
  );
}
