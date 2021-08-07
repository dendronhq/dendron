import {
	DNodeUtils
} from "@dendronhq/common-all";
import {
	createLogger, TreeViewUtils
} from "@dendronhq/common-frontend";
import { Spin, Tree, TreeProps } from "antd";
import _ from "lodash";
import { useRouter } from "next/router";
import { DataNode } from "rc-tree/lib/interface";
import React, { useState } from "react";
import { getNoteRouterQuery } from "../utils/etc";
import { NoteData } from "../utils/types";

type OnExpandFunc = TreeProps["onExpand"];
type OnSelectFunc = TreeProps["onSelect"];

export default function DendronTreeView({notes, domains}: Partial<NoteData>) {
  const logger = createLogger("DendronTreeView");
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);

	// --- Effects
	const router = useRouter();
	const noteQuery = getNoteRouterQuery(router);
	const noteActiveId = noteQuery.id;

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
		throw Error("not implemented");
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
