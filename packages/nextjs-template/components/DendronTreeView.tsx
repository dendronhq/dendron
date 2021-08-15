import {
  createLogger,
  ThemeUtils,
  TreeViewUtils,
} from "@dendronhq/common-frontend";
import { Tree, TreeProps } from "antd";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React, { useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useDendronRouter } from "../utils/hooks";
import { DendronCommonProps, NoteData, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";

type OnExpandFunc = TreeProps["onExpand"];
type OnSelectFunc = TreeProps["onSelect"];

export default function DendronTreeViewContainer(props: Partial<NoteData>) {
  const dendronRouter = useDendronRouter();
  return DendronTreeView({ ...props, dendronRouter });
}

function DendronTreeView({
  dendronRouter,
  ...noteDataProps
}: DendronCommonProps) {
  const { notes } = noteDataProps;
  const logger = createLogger("DendronTreeView");
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);
  const { changeActiveNote } = dendronRouter;

  // --- Effects

  React.useEffect(() => {
    if (!verifyNoteData(noteDataProps)) {
      return;
    }
    const noteActiveId = _.isUndefined(dendronRouter.query.id)
      ? noteDataProps.noteIndex.id
      : dendronRouter.query.id;
    logger.info({
      state: "useEffect:preCalculateTree",
    });
    const _activeNoteIds = TreeViewUtils.getAllParents({
      notes: noteDataProps.notes,
      noteId: noteActiveId,
    });
    setActiveNoteIds(_activeNoteIds);
    logger.info({
      state: "useEffect:postCalculateTree",
      activeNoteIds,
    });
  }, [notes, dendronRouter.query.id]);

  // --- Verify
  if (!verifyNoteData(noteDataProps)) {
    logger.info({
      state: "exit:notes not initialized",
    });
    return <DendronSpinner />;
  }

  // --- Methods
  const onExpand: OnExpandFunc = (expandedKeys, { node, expanded }) => {
    const id = node.key as string;
    logger.info({ ctx: "onExpand", expandedKeys, id, expanded });
    if (_.isUndefined(notes)) {
      return;
    }
    // open up
    if (expanded) {
      setActiveNoteIds(TreeViewUtils.getAllParents({ notes, noteId: id }));
    } else {
      setActiveNoteIds(
        TreeViewUtils.getAllParents({ notes, noteId: id }).slice(0, -1)
      );
    }
  };
  const onSelect: OnSelectFunc = (_selectedKeys, { node }) => {
    const id = node.key as string;
    changeActiveNote(id, { noteIndex: noteDataProps.noteIndex });
  };

  // --- Render
  const roots = noteDataProps.domains.map((note) => {
    return TreeViewUtils.note2TreeDatanote({
      noteId: note.id,
      noteDict: noteDataProps.notes,
      showVaultName: false,
      applyNavExclude: true,
    });
  }) as DataNode[];
  const expandKeys = _.isEmpty(activeNoteIds) ? [] : activeNoteIds;
  return (
    <>
      <TreeView
        treeData={roots}
        defaultExpandKeys={expandKeys}
        onExpand={onExpand}
        onSelect={onSelect}
      />
    </>
  );
}

function TreeView({
  treeData,
  defaultExpandKeys,
  onExpand,
  onSelect,
}: {
  treeData: DataNode[];
  defaultExpandKeys: string[];
  onExpand: OnExpandFunc;
  onSelect: OnSelectFunc;
}) {
  const { currentTheme } = useThemeSwitcher();
  const maybeTheme = ThemeUtils.getTheme(currentTheme || "light");
  return (
    <>
      {treeData.length ? (
        <Tree
          style={{ background: maybeTheme?.layoutHeaderBackground }}
          showIcon
          expandedKeys={defaultExpandKeys}
          selectedKeys={defaultExpandKeys.slice(-1)}
          onExpand={onExpand}
          onSelect={onSelect}
          treeData={treeData}
        />
      ) : (
        <DendronSpinner />
      )}
    </>
  );
}
