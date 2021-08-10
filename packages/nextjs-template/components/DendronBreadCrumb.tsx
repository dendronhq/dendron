import { Breadcrumb } from "antd";
import _ from "lodash";
import React from "react";
import { NoteUtils } from "@dendronhq/common-all";
import { DendronCommonProps, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";

export function DendronBreadCrumb(props: DendronCommonProps) {
  if (!verifyNoteData(props)) {
    return <DendronSpinner />;
  } else {
    const { dendronRouter, notes } = props;
    const noteActive = notes[dendronRouter.query.id];
    const noteParents = NoteUtils.getNoteWithParents({
      note: noteActive,
      notes,
    });
    return (
      <Breadcrumb style={{ margin: "16px 0" }}>
        {_.map(noteParents, (note) => {
          return <Breadcrumb.Item key={note.id}>{note.title}</Breadcrumb.Item>;
        })}
      </Breadcrumb>
    );
  }
}
