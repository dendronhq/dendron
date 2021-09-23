import { BookOutlined, PlusOutlined, NumberOutlined } from "@ant-design/icons";
import { Spin , Tree, TreeProps } from "antd";
import {
  DendronTreeViewKey,
  DMessageSource,
  DNodeUtils,
  NoteProps,
  NotePropsDict,
  TreeViewMessage,
  TreeViewMessageType,
  VaultUtils,
  TAGS_HIERARCHY,
  TAGS_HIERARCHY_BASE,
  NoteUtils,
  makeColorTranslucent,
  isNotUndefined,
} from "@dendronhq/common-all";
import {
  createLogger,
  engineSlice,
  ideHooks,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";

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

  // analytics
  React.useEffect(() => {
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
  }, []);

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
  ) as DataNode[];
  // controlled compo: what keys should be expanded
  const expandKeys = _.isEmpty(activeNoteIds) ? [] : activeNoteIds;
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
         />
      ) : (
        <Spin />
      )}
    </>
  );
}
