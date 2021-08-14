import { Breadcrumb } from "antd";
import _ from "lodash";
import React from "react";
import { NoteUtils } from "@dendronhq/common-all";
import { useNoteActive } from "../utils/hooks";
import { DendronCommonProps, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";

export function DendronBreadCrumb(props: DendronCommonProps) {
  const { dendronRouter } = props;
  const { noteActive } = useNoteActive(dendronRouter.getActiveNoteId());
  // no breadcrumb for home page
  if (!verifyNoteData(props)) {
    return null;
  }
  if (
    !noteActive ||
    !verifyNoteData(props) ||
    noteActive.id === props.noteIndex.id
  ) {
    return null;
  }
  const noteParents = NoteUtils.getNoteWithParents({
    note: noteActive,
    notes: props.notes,
  });
  return (
    <Breadcrumb style={{ margin: "16px 0" }}>
      {_.map(noteParents, (note) => {
        return <Breadcrumb.Item key={note.id}>{note.title}</Breadcrumb.Item>;
      })}
    </Breadcrumb>
  );
}
