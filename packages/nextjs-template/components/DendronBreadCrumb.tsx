import { Breadcrumb } from "antd";
import _ from "lodash";
import React from "react";
import { TreeUtils } from "@dendronhq/common-all";
import { useNoteActive } from "../utils/hooks";
import { getNoteUrl } from "../utils/links";
import { useCombinedSelector } from "../features";
import { DendronCommonProps, verifyNoteData } from "../utils/types";
import Link from "next/link";

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

  const noteIdPareents = TreeUtils.getAllParents({
    child2parent: tree?.child2parent ?? {},
    noteId: noteActive.id,
  }).concat(noteActive.id);
  const noteParents = noteIdPareents.map((noteId) => props.notes[noteId]);

  return (
    // @ts-ignore
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
