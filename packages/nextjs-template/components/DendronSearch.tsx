import { LoadingStatus } from "@dendronhq/common-frontend";
import { AutoComplete, Alert } from "antd";
import React from "react";
import { useCombinedDispatch } from "../features";
import { browserEngineSlice } from "../features/engine";
import { useFetchFuse } from "../utils/fuse";
import {
  DendronCommonProps,
  DendronPageWithNoteDataProps,
  verifyNoteData,
} from "../utils/types";
import DendronSpinner from "./DendronSpinner";

const LOADING_KEY = "__loading";
const LOADING_MESSAGE = "Loading...";

export function DendronSearch(props: DendronCommonProps) {
  if (!verifyNoteData(props)) {
    return <DendronSpinner />;
  }

  return <DendronSearchComponent {...props} />;
}

function DendronSearchComponent(props: DendronPageWithNoteDataProps) {
  const dispatch = useCombinedDispatch();
  const { noteIndex, dendronRouter } = props;
  const [value, setValue] = React.useState("");
  const { ensureIndexReady, fuse, error, loading } = useFetchFuse(props.notes);
  if (error) {
    return (
      <Alert
        type="error"
        closable={false}
        message="Error loading data for the search."
      />
    );
  }
  return (
    <>
      <AutoComplete
        onClick={ensureIndexReady}
        style={{ width: "100%" }}
        value={value}
        onChange={setValue}
        onSelect={(_selection, option) => {
          const id = option.key?.toString()!;
          dendronRouter.changeActiveNote(id, { noteIndex });
          dispatch(
            browserEngineSlice.actions.setLoadingStatus(LoadingStatus.PENDING)
          );
        }}
        placeholder="Search"
      >
        {loading ? (
          <AutoComplete.Option
            key={LOADING_KEY}
            value={LOADING_MESSAGE}
            disabled
          >
            <div>{LOADING_MESSAGE}</div>
          </AutoComplete.Option>
        ) : undefined}
        {fuse
          ? fuse.search(value).map((note) => (
              <AutoComplete.Option key={note.item.id} value={note.item.fname}>
                <div>{note.item.title}</div>
              </AutoComplete.Option>
            ))
          : undefined}
      </AutoComplete>
    </>
  );
}
