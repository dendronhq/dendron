import { Breadcrumb } from "antd";
import _ from "lodash";
import React from "react";
import { NoteProps, NotePropsByIdDict } from "@dendronhq/common-all";
import { useNoteActive } from "../utils/hooks";
import { getNoteUrl } from "../utils/links";
import { useCombinedSelector } from "../features";
import { DendronCommonProps, verifyNoteData } from "../utils/types";
import Link from "next/link";

function getBreadcrumb(
  noteDict: NotePropsByIdDict,
  noteId?: string
): NoteProps[] {
  const note = noteId ? noteDict[noteId] : undefined;
  const noteParent = note?.parent ? noteDict[note.parent] : undefined;
  return [
    ...(noteParent ? getBreadcrumb(noteDict, noteParent.id) : []),
    ...(note ? [note] : []),
  ];
}

export function DendronBreadCrumb(props: DendronCommonProps) {
  const ide = useCombinedSelector((state) => state.ide);
  const tree = ide.tree;
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

  const noteParents = getBreadcrumb(props.notes, props.note?.id);

  return (
    <Breadcrumb style={{ margin: "16px 0" }}>
      {_.map(noteParents, (note) => {
        const dest = getNoteUrl({ note, noteIndex: props.noteIndex });
        return (
          // @ts-ignore
          <Breadcrumb.Item key={note.id}>
            <Link href={dest}>
              {tree?.notesLabelById?.[note.id] ?? note.title}
            </Link>
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
}
