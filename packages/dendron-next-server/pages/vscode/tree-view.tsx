import {
  DMessage,
  DMessageSource,
  DNodeUtils,
  NoteProps,
  NotePropsDict,
  TreeViewMessage,
  TreeViewMessageType,
  VaultUtils,
} from "@dendronhq/common-all";
import { engineSlice, useVSCodeMessage, VSCodeUtils } from "@dendronhq/common-frontend";
import { Tree, TreeProps } from "antd";
import { Logger } from "aws-amplify";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React, { useState } from "react";

type OnExpandFunc = TreeProps["onExpand"];
type OnSelectFunc = TreeProps["onSelect"];

class TreeViewUtils {
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
      pNote = notes[pNote.parent];
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
  }): DataNode {
    const note = noteDict[noteId];
    const vname = VaultUtils.getName(note.vault);
    return {
      key: note.id,
      title: note.title + (showVaultName ? ` (${vname})` : ""),
      children: note.children.map((ent) =>
        TreeViewUtils.note2TreeDatanote({ noteId: ent, noteDict })
      ),
    };
  }
}

export default function TreeViewContainer({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const [msg, setMsg] = useState<DMessage>();
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);
  useVSCodeMessage((msg) => {
    setMsg(msg);
  });
  const logger = new Logger("treeViewContainer");
  logger.info({ ctx: "TreeViewContainer", state: "enter", engine });

  // --- Setup
  const onExpand: OnExpandFunc = (expandedKeys, { node, expanded }) => {
    const id = node.key as string;
    logger.info({ ctx: "onExpand", expandedKeys, id, expanded });
    // open up
    if (expanded) {
      setActiveNoteIds(
        TreeViewUtils.getAllParents({ notes: engine.notes, noteId: id })
      );
    } else {
      setActiveNoteIds(
        TreeViewUtils.getAllParents({ notes: engine.notes, noteId: id }).slice(
          0,
          -1
        )
      );
    }
  };

  // --- Logic
  // what keys shod be open
  React.useEffect(() => {
    logger.info({
      ctx: "TreeViewContainer",
      state: "useEffect:preCalculateTree",
    });
    // check if we got a message
    if (!_.isUndefined(msg)) {
      logger.info({
        ctx: "TreeViewContainer:cacluateActiveNoteId",
        state: "enter",
      });
      const _activeNoteIds = TreeViewUtils.getAllParents({
        notes: engine.notes,
        noteId: msg.data.id,
      });
      setActiveNoteIds(_activeNoteIds);
      logger.info({
        ctx: "TreeViewContainer:cacluateActiveNoteId",
        state: "exit",
        activeNoteIds,
      });
      setMsg(undefined);
    }
  }, [msg, engine.notes]);

  const roots = _.filter(_.values(engine.notes), DNodeUtils.isRoot).map(
    (ent) => {
      return TreeViewUtils.note2TreeDatanote({
        noteId: ent.id,
        noteDict: engine.notes,
        showVaultName: true,
      });
    }
  );
  // controlled compo: what keys should be expanded
  const expandKeys = _.isEmpty(activeNoteIds) ? [] : activeNoteIds;

  return (
    <>
      <TreeView
        treeData={roots}
        defaultExpandKeys={expandKeys}
        onExpand={onExpand}
      />
    </>
  );
}

function TreeView({
  treeData,
  defaultExpandKeys,
  onExpand,
}: {
  treeData: DataNode[];
  defaultExpandKeys: string[];
  onExpand: OnExpandFunc;
}) {
  const onSelect: OnSelectFunc = (selectedKeys, { node }) => {
    const id = node.key;
    VSCodeUtils.postMessage({
      type: TreeViewMessageType.onSelect,
      data: { id },
      source: DMessageSource.webClient,
    } as TreeViewMessage);
  };
  return (
    <>
      {treeData.length ? (
        <Tree
          expandedKeys={defaultExpandKeys}
          selectedKeys={defaultExpandKeys.slice(-1)}
          onExpand={onExpand}
          onSelect={onSelect}
          treeData={treeData}
        ></Tree>
      ) : (
        "Loading..."
      )}
    </>
  );
}
