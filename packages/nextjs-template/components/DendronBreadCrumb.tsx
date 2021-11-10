import { Breadcrumb } from "antd";
import _ from "lodash";
import React, { useMemo } from "react";
import { NoteUtils, NoteProps, NotePropsDict } from "@dendronhq/common-all";
import { useDendronRouter, useNoteActive } from "../utils/hooks";
import { getNoteUrl } from "../utils/links";
import {
  DendronCommonProps,
  SectionsData,
  verifyNoteData,
} from "../utils/types";
import DendronSpinner from "./DendronSpinner";
import Link from "next/link";

export function DendronBreadCrumb(props: {
  notes: SectionsData["notes"];
  indexId: string;
}) {
  const { getActiveNoteId } = useDendronRouter();
  const noteActive = useMemo(() => getActiveNoteId(), [getActiveNoteId]);

  if (!noteActive) {
    return null;
  }

  // TODO: noteActive should be an string always
  const noteParents = NoteUtils.getNoteWithParents({
    note: props.notes[noteActive] as NoteProps,
    notes: props.notes as NotePropsDict,
  });

  return (
    <Breadcrumb style={{ margin: "16px 0" }}>
      {_.map(noteParents, (note) => {
        const dest = getNoteUrl({ note, indexId: props.indexId });
        return (
          <Breadcrumb.Item key={note.id}>
            <Link href={dest}>{note.title}</Link>
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
}
