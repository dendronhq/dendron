export default function foo() {
	return <></>
}
// import { BookOutlined, PlusOutlined } from "@ant-design/icons";
// import { Spin } from "antd";
// import {
//   DendronTreeViewKey,
//   DMessageSource,
//   DNodeUtils,
//   NoteProps,
//   NotePropsDict,
//   TreeViewMessage,
//   TreeViewMessageType,
//   VaultUtils,
// } from "@dendronhq/common-all";
// import {
//   createLogger,
//   engineSlice,
//   ideHooks,
//   postVSCodeMessage,
// } from "@dendronhq/common-frontend";
// import { Tree, TreeProps } from "antd";
// import _ from "lodash";
// import { DataNode } from "rc-tree/lib/interface";
// import React, { useState } from "react";
// import { ideSlice } from "@dendronhq/common-frontend/lib/features/ide/slice";

// type OnExpandFunc = TreeProps["onExpand"];
// type OnSelectFunc = TreeProps["onSelect"];

// // export default function TreeViewParent() {
// //   const logger = createLogger("DendronTreeView");
// //   const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);

// //   const onExpand: OnExpandFunc = (expandedKeys, { node, expanded }) => {
// //     const id = node.key as string;
// //     logger.info({ ctx: "onExpand", expandedKeys, id, expanded });
// //     // open up
// //     if (expanded) {
// //       setActiveNoteIds(
// //         TreeViewUtils.getAllParents({ notes: engine.notes!, noteId: id })
// //       );
// //     } else {
// //       setActiveNoteIds(
// //         TreeViewUtils.getAllParents({ notes: engine.notes!, noteId: id }).slice(
// //           0,
// //           -1
// //         )
// //       );
// //     }
// //   };
// // }