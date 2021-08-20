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
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React, { useState, useEffect } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useDendronRouter } from "../utils/hooks";
import { DendronCommonProps, NoteData, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";

const { SubMenu } = Menu;

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

  const { notes, domains, noteIndex } = noteDataProps;

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

  const expandKeys = _.isEmpty(activeNoteIds) ? [] : activeNoteIds;

  // --- Calc
  const roots = domains.map((note) => {
    return TreeViewUtils.note2TreeDatanote({
      noteId: note.id,
      noteDict: notes,
      showVaultName: false,
      applyNavExclude: true,
    });
  }) as DataNode[];

  // --- Methods
  const onSelect = (noteId: string) => {
    logger.info({ ctx: "onSelect", id: noteId });
    changeActiveNote(noteId, { noteIndex: noteDataProps.noteIndex });
  };

  return <MenuView roots={roots} expandKeys={expandKeys} onSelect={onSelect} />;

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

function ExpandIcon({
  eventKey,
  isOpen,
}: {
  eventKey: string;
  isOpen: boolean;
}) {
  const Icon = isOpen ? UpOutlined : DownOutlined;
  return (
    <Icon
      data-expandedicon="true"
      style={{
        position: "absolute",
        right: 10,
        margin: 0,
        padding: 10,
        // TODO and onHover styles
      }}
    />
  );
}

function MenuView({
  roots,
  expandKeys,
  onSelect,
}: {
  roots: DataNode[];
  expandKeys: string[];
  onSelect: (noteId: string) => void;
}) {
  const createMenu = (menu: DataNode) => {
    if (menu.children && menu.children.length > 0) {
      return (
        <SubMenu
          key={menu.key}
          title={menu.title}
          onTitleClick={(event) => {
            const target = event.domEvent.target as HTMLElement;
            const isArrow = target.dataset.expandedicon;
            if (!isArrow) {
              onSelect(event.key);
            }
          }}
        >
          {menu.children.map((childMenu: DataNode) => {
            return createMenu(childMenu);
          })}
        </SubMenu>
      );
    }
    return <Menu.Item key={menu.key}>{menu.title}</Menu.Item>;
  };

  return (
    <Menu
      mode="inline"
      defaultOpenKeys={expandKeys}
      defaultSelectedKeys={expandKeys}
      onClick={({ key }) => onSelect(key)}
      inlineIndent={DENDRON_STYLE_CONSTANTS.SIDER.INDENT}
      expandIcon={ExpandIcon}
    >
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
