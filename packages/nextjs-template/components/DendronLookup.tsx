import { NoteIndexProps, NoteLookupUtils } from "@dendronhq/common-all";
import { createLogger, LoadingStatus } from "@dendronhq/common-frontend";
import { AutoComplete } from "antd";
import _ from "lodash";
import React from "react";
import { useCombinedDispatch, useCombinedSelector } from "../features";
import { browserEngineSlice } from "../features/engine";
import {
  DendronLookupProps,
  useDendronLookup,
  useNoteActive,
} from "../utils/hooks";
import {
  DendronCommonProps,
  DendronPageWithNoteDataProps,
  verifyNoteData,
} from "../utils/types";
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

type AntDOnSelect = Parameters<typeof AutoComplete>["0"]["onSelect"];
function AntDAutoComplete(
  props: { lookup: DendronLookupProps } & DendronPageWithNoteDataProps
) {
  // --- Hooks
  const dispatch = useCombinedDispatch();

  // --- Main
  const logger = createLogger("AntDAutoComplete");
  const ctx = "AntDAutoComplete";
  const { lookup, dendronRouter, noteIndex, notes } = props;
  const { noteActive } = useNoteActive(dendronRouter.getActiveNoteId());
  const initValue = noteActive?.fname || "";
  const [value, setValue] = React.useState(initValue);
  const [result, setResult] = React.useState<NoteIndexProps[]>([]);
  logger.info({ ctx, value, initValue });
  const engine = useCombinedSelector((state) => state.engine);

  // update lookup when current note changes
  React.useEffect(() => {
    setValue(initValue);
  }, [initValue]);

  const onSearch = (qs: string) => {
    logger.info({ state: "onSearch:enter", qs });
    const out =
      qs === ""
        ? NoteLookupUtils.fetchRootResults(notes, { config: engine.config })
        : lookup?.queryNote({ qs });
    setResult(_.isUndefined(out) ? [] : out);
  };
  const onSelect: AntDOnSelect = (noteId, option) => {
    logger.info({ state: "onSelect", noteId, option });
    const id = option.key?.toString()!;
    dendronRouter.changeActiveNote(id, { noteIndex });
    dispatch(
      browserEngineSlice.actions.setLoadingStatus(LoadingStatus.PENDING)
    );
  };
  const onClick = () => {
    const qs = NoteLookupUtils.getQsForCurrentLevel(initValue);
    onSearch(qs);
  };
  const onChange = (data: string) => {
    setValue(data);
  };
  return (
    <AutoComplete
      value={value}
      style={{ width: "100%" }}
      onSelect={onSelect}
      onSearch={onSearch}
      onChange={onChange}
      onClick={onClick}
      placeholder="Lookup"
    >
      {result.map((noteIndex: NoteIndexProps) => (
        <Option key={noteIndex.id} value={noteIndex.fname}>
          <div>{noteIndex.fname}</div>
        </Option>
      ))}
    </AutoComplete>
  );
}
