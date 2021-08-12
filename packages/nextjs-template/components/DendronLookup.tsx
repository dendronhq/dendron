import { NoteIndexProps } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-frontend";
import { AutoComplete } from "antd";
import _ from "lodash";
import React from "react";
import { useCombinedDispatch } from "../features";
import { pageStateSlice } from "../features/pageState";
import { LoadingStatus } from "../features/pageState/slice";
import { DendronLookupProps, useDendronLookup } from "../utils/hooks";
import { DendronCommonProps, DendronPageWithNoteDataProps, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";

const { Option } = AutoComplete;

export function DendronLookup(props: DendronCommonProps) {
  const logger = createLogger("DendronLookup");
  // --- Hooks
  const lookup = useDendronLookup();
  logger.info({ state: "enter", lookup });

  // --- Presentation
  if (!verifyNoteData(props)) {
    return <DendronSpinner />;
  }

  // --- Methods

  // --- Logic
  return <AntDAutoComplete lookup={lookup} {...props} />;
}


type AntDOnSelect = Parameters<typeof AutoComplete>["0"]["onSelect"]
function AntDAutoComplete(
  props: { lookup: DendronLookupProps } & DendronPageWithNoteDataProps
) {
  // --- Hooks
  const dispatch = useCombinedDispatch()

  // --- Main
  const logger = createLogger("AntDAutoComplete");
  const ctx = "AntDAutoComplete";
  const { lookup, dendronRouter, notes, noteIndex } = props;
  const maybeIdByQuery = dendronRouter.query?.id;
  const maybeNote = !_.isUndefined(maybeIdByQuery) ? notes[maybeIdByQuery] : undefined;
  const initValue = !_.isUndefined(maybeIdByQuery) ? notes[maybeIdByQuery].fname : "";
  const [value, setValue] = React.useState(initValue);
  const [result, setResult] = React.useState<NoteIndexProps[]>([]);
  logger.info({ctx, value, initValue});

  // update lookup when current note changes
  React.useEffect(()=> {
    setValue(initValue);
  }, [initValue])

  const onSearch = (qs: string) => {
    logger.info({ state: "onSearch:enter", qs });
    const out = lookup?.queryNote({ qs });
    setResult(_.isUndefined(out) ? [] : out);
  };
  const onSelect: AntDOnSelect = (noteId, option) => {
    logger.info({state: "onSelect", noteId, option})
    const id = option.key?.toString()!
    dendronRouter.changeActiveNote(id, {noteIndex});
    dispatch(pageStateSlice.actions.setLoadingStatus(LoadingStatus.PENDING));
  };
  const onChange = (data: string) => {
    setValue(data);
  };
  return (
    <AutoComplete
      value={value}
      style={{ width: "60%"}}
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
