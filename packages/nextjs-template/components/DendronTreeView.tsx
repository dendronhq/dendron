import {
	createLogger, ThemeUtils, TreeViewUtils
} from "@dendronhq/common-frontend";
import { Spin, Tree, TreeProps } from "antd";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React, { useState } from "react";
import { ThemeSwitcherProvider, useThemeSwitcher } from "react-css-theme-switcher";
import { DendronRouterProps, useDendronRouter } from "../utils/hooks";
import { NoteData } from "../utils/types";

type OnExpandFunc = TreeProps["onExpand"];
type OnSelectFunc = TreeProps["onSelect"];

type DendronTreeViewProps = Partial<NoteData> & {dendronRouter: DendronRouterProps};

export default function DendronTreeViewContainer({notes, domains}: Partial<NoteData>) {
	const dendronRouter = useDendronRouter();
	return DendronTreeView({notes, domains, dendronRouter})
}


function DendronTreeView({notes, domains, dendronRouter}: DendronTreeViewProps) {
  const logger = createLogger("DendronTreeView");
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);
	const {changeActiveNote} = dendronRouter;


	// --- Effects
	const noteActiveId = dendronRouter.query.id;

  React.useEffect(() => {
		if (_.isEmpty(notes) || _.isUndefined(notes)) {
			return;
		}
      logger.info({
        state: "useEffect:preCalculateTree",
      });
      const _activeNoteIds = TreeViewUtils.getAllParents({
        notes,
        noteId: noteActiveId,
      });
      setActiveNoteIds(_activeNoteIds);
      logger.info({
        state: "useEffect:postCalculateTree",
        activeNoteIds,
      });
  }, [notes, noteActiveId]);

	// --- Methods
  const onExpand: OnExpandFunc = (expandedKeys, { node, expanded }) => {
    const id = node.key as string;
    logger.info({ ctx: "onExpand", expandedKeys, id, expanded });
		if (_.isUndefined(notes)) {
			return;
		}
    // open up
    if (expanded) {
      setActiveNoteIds(
        TreeViewUtils.getAllParents({ notes, noteId: id })
      );
    } else {
      setActiveNoteIds(
        TreeViewUtils.getAllParents({ notes, noteId: id }).slice(
          0,
          -1
        )
      );
    }
  };
	const onSelect: OnSelectFunc = (_selectedKeys, { node }) => {
    const id = node.key as string;
		changeActiveNote(id);
  };

	// --- Render
  if (_.isEmpty(notes) || _.isUndefined(notes)) {
    logger.info({
      state: "exit:notes not initialized",
    });
    return <Spin />;
  }
  const roots = _.filter(domains).map(
    (ent) => {
      return TreeViewUtils.note2TreeDatanote({
        noteId: ent.id,
        noteDict: notes,
        showVaultName: true,
      });
    }
  ) as DataNode[];
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
          style={{background: maybeTheme?.layoutHeaderBackground}}
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
