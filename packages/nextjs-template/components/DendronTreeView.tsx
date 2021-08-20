import {
  createLogger,
  ThemeUtils,
  TreeViewUtils,
} from "@dendronhq/common-frontend";
import {
  Tree,
  TreeProps,
  Menu,
  MenuProps,
  MenuItemProps,
  SubMenuProps,
} from "antd";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React, { useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useDendronRouter } from "../utils/hooks";
import { DendronCommonProps, NoteData, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";

const { SubMenu } = Menu;

type OnExpandFunc = SubMenuProps["onTitleClick"];
type OnSelectFunc = MenuProps["onClick"];

export default function DendronTreeViewContainer(props: Partial<NoteData>) {
  const dendronRouter = useDendronRouter();
  return DendronTreeView({ ...props, dendronRouter });
}

function DendronTreeView({
  dendronRouter,
  ...noteDataProps
}: DendronCommonProps) {
  const logger = createLogger("DendronTreeView");
  const { changeActiveNote } = dendronRouter;

  // --- Verify
  if (!verifyNoteData(noteDataProps)) {
    logger.info({
      state: "exit:notes not initialized",
    });
    return <DendronSpinner />;
  }

  const { notes, noteIndex, domains } = noteDataProps;

  // --- Calc
  const noteActiveId = _.isUndefined(dendronRouter.query.id)
    ? noteIndex.id
    : dendronRouter.query.id;
  logger.info({
    state: "useEffect:preCalculateTree",
  });

  const activeNoteIds = TreeViewUtils.getAllParents({
    notes,
    noteId: noteActiveId,
  });

  const roots = domains.map((note) => {
    return TreeViewUtils.note2TreeDatanote({
      noteId: note.id,
      noteDict: notes,
      showVaultName: false,
      applyNavExclude: true,
    });
  }) as DataNode[];

  const expandKeys = _.isEmpty(activeNoteIds) ? [] : activeNoteIds;

  // --- Methods
  const onExpand: OnExpandFunc = (event) => {
    const id = event.key as string;
    logger.info({ ctx: "onExpand", id });
    if (_.isUndefined(notes)) {
      return;
    }
    // open up
    // if (expanded) {
    //   setActiveNoteIds(TreeViewUtils.getAllParents({ notes, noteId: id }));
    // } else {
    //   setActiveNoteIds(
    //     TreeViewUtils.getAllParents({ notes, noteId: id }).slice(0, -1)
    //   );
    // }
  };
  const onSelect: OnSelectFunc = ({ key: id }) => {
    changeActiveNote(id, { noteIndex: noteDataProps.noteIndex });
  };

  return (
    <MenuView
      roots={roots}
      expandKeys={expandKeys}
      onExpand={onExpand}
      onSelect={onSelect}
    />
  );

  // return (
  //   <>
  //     <TreeView
  //       treeData={roots}
  //       defaultExpandKeys={expandKeys}
  //       onExpand={onExpand}
  //       onSelect={onSelect}
  //     />
  //   </>
  // );
}

function MenuView({
  roots,
  expandKeys,
  onExpand,
  onSelect,
}: {
  roots: DataNode[];
  expandKeys: string[];
  onSelect: OnSelectFunc;
  onExpand: OnExpandFunc;
}) {
  const createMenu = (menu: DataNode) => {
    if (menu.children && menu.children.length > 0) {
      return (
        <SubMenu key={menu.key} title={menu.title} onTitleClick={onExpand}>
          {menu.children.map((childMenu: DataNode) => {
            return createMenu(childMenu);
          })}
        </SubMenu>
      );
    }
    return <Menu.Item key={menu.key}>{menu.title}</Menu.Item>;
  };

  return (
    <Menu mode="inline" defaultOpenKeys={expandKeys} onClick={onSelect}>
      {roots.map((menu) => {
        return createMenu(menu);
      })}
    </Menu>
  );
}

// function TreeView({
//   treeData,
//   defaultExpandKeys,
//   onExpand,
//   onSelect,
// }: {
//   treeData: DataNode[];
//   defaultExpandKeys: string[];
//   onSelect: OnSelectFunc;
//   onExpand: OnExpandFunc;
// }) {
//   const { currentTheme } = useThemeSwitcher();
//   const maybeTheme = ThemeUtils.getTheme(currentTheme || "light");
//   return (
//     <>
//       {treeData.length ? (
//         <Tree
//           style={{ background: maybeTheme?.layoutHeaderBackground }}
//           showIcon
//           expandedKeys={defaultExpandKeys}
//           selectedKeys={defaultExpandKeys.slice(-1)}
//           onExpand={onExpand}
//           onSelect={onSelect}
//           treeData={treeData}
//         />
//       ) : (
//         <DendronSpinner />
//       )}
//     </>
//   );
// }
