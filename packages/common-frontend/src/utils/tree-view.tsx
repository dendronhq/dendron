import { BookOutlined, PlusOutlined, NumberOutlined } from "@ant-design/icons";
import {
  isNotUndefined,
  makeColorTranslucent,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  TAGS_HIERARCHY,
  TAGS_HIERARCHY_BASE,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React from "react";

export class TreeViewUtils {
  /**
   * Starting from current note, get all parents of note
   * @param notes: all notes
   * @param noteId: current note id
   * @returns
   */
  static getAllParents = ({
    notes,
    noteId,
  }: {
    notes: NotePropsDict;
    noteId: string;
  }) => {
    let pNote: NoteProps = notes[noteId];
    const activeNoteIds: string[] = [];
    do {
      activeNoteIds.unshift(pNote.id);
      pNote = notes[pNote.parent as string];
    } while (pNote);
    return activeNoteIds;
  };

  static note2TreeDatanote({
    noteId,
    noteDict,
    showVaultName,
  }: {
    noteId: string;
    noteDict: NotePropsDict;
    showVaultName?: boolean;
  }): DataNode | undefined {
    const note = noteDict[noteId];
    if (_.isUndefined(note)) {
      return undefined;
    }
    const vname = VaultUtils.getName(note.vault);
    let icon;
    if (note.schema) {
      icon = <BookOutlined />;
    } else if (note.fname === TAGS_HIERARCHY_BASE) {
      icon = <NumberOutlined />;
    } else if (note.stub) {
      icon = <PlusOutlined />;
    }

    let title: any = note.title;
    if (showVaultName) title = `${title} (${vname})`;

    if (note.fname.startsWith(TAGS_HIERARCHY)) {
      let { color } = NoteUtils.color({
        fname: note.fname,
        notes: noteDict,
        vault: note.vault,
      });
      color = makeColorTranslucent(color, 0.6);
      title = (
        <span>
          <NumberOutlined style={{ color }} />
          {title}
        </span>
      );
    }

    return {
      key: note.id,
      title,
      icon,
      children: _.sortBy(
        note.children,
        (noteId) => !noteDict[noteId]?.fname?.startsWith(TAGS_HIERARCHY)
      )
        .map((noteId) => TreeViewUtils.note2TreeDatanote({ noteId, noteDict }))
        .filter(isNotUndefined),
    };
  }
}
