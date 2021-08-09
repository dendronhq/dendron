
import { BookOutlined, PlusOutlined } from "@ant-design/icons";
import {
	NoteProps,
	NotePropsDict, VaultUtils
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
    let activeNoteIds: string[] = [];
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
    let icon = undefined;
    if (note.stub) {
      icon = <PlusOutlined />;
    }
    if (note.schema) {
      icon = <BookOutlined />;
    }
    return {
      key: note.id,
      title: note.title + (showVaultName ? ` (${vname})` : ""),
      icon,
      children: note.children
        .map((ent) =>
          TreeViewUtils.note2TreeDatanote({ noteId: ent, noteDict })
        )
        .filter((ent) => !_.isUndefined(ent)) as DataNode[],
    };
  }
}