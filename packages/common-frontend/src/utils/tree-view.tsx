import { BookOutlined, PlusOutlined, NumberOutlined } from "@ant-design/icons";
import {
  isNotUndefined,
  NoteProps,
  NotePropsDict,
  TAGS_HIERARCHY,
  TAGS_HIERARCHY_BASE,
  VaultUtils,
  TreeUtils,
  TreeMenuNode,
  TreeMenuNodeIcon,
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
    } else if (note.fname.toLowerCase() === TAGS_HIERARCHY_BASE) {
      icon = <NumberOutlined />;
    } else if (note.stub) {
      icon = <PlusOutlined />;
    }

    let title: any = note.title;
    if (showVaultName) title = `${title} (${vname})`;

    if (note.fname.startsWith(TAGS_HIERARCHY)) {
      title = (
        <span>
          <NumberOutlined />
          {title}
        </span>
      );
    }

    return {
      key: note.id,
      title,
      icon,
      children: TreeUtils.sortNotesAtLevel({
        noteIds: note.children,
        noteDict,
        reverse: note.custom?.sort_order === "reverse",
      })
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

  static treeMenuNode2DataNode({
    roots,
    showVaultName,
    applyNavExclude = false,
  }: {
    roots: TreeMenuNode[];
    showVaultName?: boolean;
    applyNavExclude: boolean;
  }): DataNode[] {
    return roots
      .map((node: TreeMenuNode) => {
        let icon;
        if (node.icon === TreeMenuNodeIcon.bookOutlined) {
          icon = <BookOutlined />;
        } else if (node.icon === TreeMenuNodeIcon.numberOutlined) {
          icon = <NumberOutlined />;
        } else if (node.icon === TreeMenuNodeIcon.plusOutlined) {
          icon = <PlusOutlined />;
        }

        if (applyNavExclude && node.navExclude) {
          return undefined;
        }

        let title: any = node.title;
        if (showVaultName) title = `${title} (${node.vaultName})`;

        if (node.hasTitleNumberOutlined) {
          title = (
            <span>
              <NumberOutlined />
              {title}
            </span>
          );
        }

        return {
          key: node.key,
          title,
          icon,
          children: node.children
            ? TreeViewUtils.treeMenuNode2DataNode({
                roots: node.children,
                showVaultName,
                applyNavExclude,
              })
            : [],
        };
      })
      .filter(isNotUndefined);
  }
}
