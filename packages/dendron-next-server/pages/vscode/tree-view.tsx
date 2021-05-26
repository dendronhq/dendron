import { BookOutlined, PlusOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import {
  DendronTreeViewKey,
  DMessageSource,
  DNodeUtils,
  NoteProps,
  NotePropsDict,
  TreeViewMessage,
  TreeViewMessageType,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  createLogger,
  engineSlice,
  ideHooks,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import { Tree, TreeProps } from "antd";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React, { useState } from "react";
import { DendronProps } from "../../lib/types";
import { ideSlice } from "@dendronhq/common-frontend/lib/features/ide/slice";

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
  }): DataNode {
    const note = noteDict[noteId];
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
      children: note.children.map((ent) =>
        TreeViewUtils.note2TreeDatanote({ noteId: ent, noteDict })
      ),
    };
  }
}

const { EngineSliceUtils } = engineSlice;

function areEqual(prevProps: DendronProps, nextProps: DendronProps) {
  const logger = createLogger("treeViewContainer");
  const isDiff = _.some([
    // active note changed
    prevProps.ide.noteActive?.id !== nextProps.ide.noteActive?.id,
    // engine initialized for first time
    _.isUndefined(prevProps.engine.notes) ||
      (_.isEmpty(prevProps.engine.notes) && !_.isEmpty(nextProps.engine.notes)),
    // engine just went from pending to loading
    prevProps.engine.loading === "pending" &&
      nextProps.engine.loading === "idle",
  ]);
  logger.info({ state: "areEqual", isDiff, prevProps, nextProps });
  return !isDiff;
}

const TreeViewContainer = React.memo(TreeViewParent, areEqual);
export default TreeViewContainer;

function TreeViewParent({ engine, ide }: DendronProps) {
  // --- init
  const ctx = "TreeViewContainer";
  const logger = createLogger("treeViewContainer");
  const ideDispatch = ideHooks.useIDEAppDispatch();
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);
  logger.info({
    ctx,
    state: "enter",
    engine,
    ide,
  });
  const onExpand: OnExpandFunc = (expandedKeys, { node, expanded }) => {
    const id = node.key as string;
    logger.info({ ctx: "onExpand", expandedKeys, id, expanded });
    // open up
    if (expanded) {
      setActiveNoteIds(
        TreeViewUtils.getAllParents({ notes: engine.notes!, noteId: id })
      );
    } else {
      setActiveNoteIds(
        TreeViewUtils.getAllParents({ notes: engine.notes!, noteId: id }).slice(
          0,
          -1
        )
      );
    }
  };
  const engineInitialized = EngineSliceUtils.hasInitialized(engine);
  // what keys shod be open
  const { noteActive } = ide;
  // --- effects
  React.useEffect(() => {
    if (noteActive && engineInitialized) {
      logger.info({
        ctx,
        state: "useEffect:preCalculateTree",
      });
      const _activeNoteIds = TreeViewUtils.getAllParents({
        notes: engine.notes!,
        noteId: noteActive.id,
      });
      setActiveNoteIds(_activeNoteIds);
      logger.info({
        ctx,
        state: "useEffect:postCalculateTree",
        activeNoteIds,
      });
    }
  }, [noteActive?.id, engineInitialized]);

  // --- render
  if (!engineInitialized) {
    logger.info({
      ctx,
      state: "exit:engineNoInit",
    });
    return <Spin />;
  }
  const roots = _.filter(_.values(engine.notes), DNodeUtils.isRoot).map(
    (ent) => {
      return TreeViewUtils.note2TreeDatanote({
        noteId: ent.id,
        noteDict: engine.notes!,
        showVaultName: true,
      });
    }
  );
  // controlled compo: what keys should be expanded
  const expandKeys = _.isEmpty(activeNoteIds) ? [] : activeNoteIds;
  if (!ide.views[DendronTreeViewKey.TREE_VIEW_V2].ready) {
    logger.info({
      ctx,
      state: "setViewReady",
    });
    ideDispatch(
      ideSlice.actions.setViewReady({
        key: DendronTreeViewKey.TREE_VIEW_V2,
        ready: true,
      })
    );
    postVSCodeMessage({
      source: DMessageSource.webClient,
      type: TreeViewMessageType.onReady,
      data: {},
    });
  }
  logger.info({
    ctx,
    state: "exit",
  });

  // --- render
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
  const onSelect: OnSelectFunc = (_selectedKeys, { node }) => {
    const id = node.key;
    postVSCodeMessage({
      type: TreeViewMessageType.onSelect,
      data: { id },
      source: DMessageSource.webClient,
    } as TreeViewMessage);
  };
  return (
    <>
      {treeData.length ? (
        <Tree
          showIcon
          expandedKeys={defaultExpandKeys}
          selectedKeys={defaultExpandKeys.slice(-1)}
          onExpand={onExpand}
          onSelect={onSelect}
          treeData={treeData}
        ></Tree>
      ) : (
        <Spin />
      )}
    </>
  );
}
