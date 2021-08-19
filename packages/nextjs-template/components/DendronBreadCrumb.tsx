import { Breadcrumb } from "antd";
import _ from "lodash";
import React from "react";
import { NoteUtils, NoteProps } from "@dendronhq/common-all";
import { useNoteActive } from "../utils/hooks";
import { getNoteUrl } from "../utils/links";
import { DendronCommonProps, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";
import Link from "next/link";

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
        const dest = getNoteUrl({note, noteIndex: props.noteIndex})
        return (
          <Breadcrumb.Item key={note.id}>
            <Link href={dest}>
              {note.title}
            </Link>
          </Breadcrumb.Item>
        )
      })}
    </Breadcrumb>
  );
}
