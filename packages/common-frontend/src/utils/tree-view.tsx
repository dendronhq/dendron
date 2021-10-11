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
    applyNavExclude = false,
  }: {
    noteId: string;
    noteDict: NotePropsDict;
    showVaultName?: boolean;
    applyNavExclude: boolean;
  }): DataNode | undefined {
    const note = noteDict[noteId];
    if (_.isUndefined(note)) {
      return undefined;
    }
    if (applyNavExclude && note.custom?.nav_exclude) {
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
      children: this.sortNotesAtLevel({ noteIds: note.children, noteDict })
        .map((noteId) =>
          TreeViewUtils.note2TreeDatanote({
            noteId,
            noteDict,
            showVaultName,
            applyNavExclude,
          })
        )
        .filter(isNotUndefined),
    };
  }

  static sortNotesAtLevel = ({
    noteIds,
    noteDict,
  }: {
    noteIds: string[];
    noteDict: NotePropsDict;
  }): string[] => {
    return _.sortBy(
      noteIds,
      // Put tags first
      (noteId) => !noteDict[noteId]?.fname?.startsWith(TAGS_HIERARCHY_BASE),
      // Sort by titles
      (noteId) => noteDict[noteId]?.title,
      // If titles are identical, sort by last updated date
      (noteId) => noteDict[noteId]?.updated
    );
  };
}
