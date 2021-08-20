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
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);

  // --- Effect
  useEffect(() => {
    if (!verifyNoteData(noteDataProps)) {
      return;
    }

    const { noteIndex, notes } = noteDataProps;

    const noteActiveId = _.isUndefined(dendronRouter.query.id)
      ? noteIndex.id
      : dendronRouter.query.id;
    logger.info({
      state: "useEffect:preCalculateTree",
    });

    setActiveNoteIds(
      TreeViewUtils.getAllParents({
        notes,
        noteId: noteActiveId,
      })
    );
  }, [noteDataProps.noteIndex, noteDataProps.notes]);

  // --- Verify
  if (!verifyNoteData(noteDataProps)) {
    logger.info({
      state: "exit:notes not initialized",
    });
    return <DendronSpinner />;
  }

  const { notes, domains } = noteDataProps;

  // --- Calc
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
  const onExpand = (noteId: string) => {
    logger.info({ ctx: "onExpand", id: noteId });
    if (_.isUndefined(notes)) {
      return;
    }
    const expanded = expandKeys.includes(noteId);
    // open up
    if (expanded) {
      setActiveNoteIds(
        TreeViewUtils.getAllParents({ notes, noteId }).slice(0, -1)
      );
    } else {
      setActiveNoteIds(TreeViewUtils.getAllParents({ notes, noteId }));
    }
  };
  const onSelect = (noteId: string) => {
    logger.info({ ctx: "onSelect", id: noteId });
    changeActiveNote(noteId, { noteIndex: noteDataProps.noteIndex });
    setActiveNoteIds(TreeViewUtils.getAllParents({ notes, noteId }));
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

function ExpandIcon({
  eventKey,
  isOpen,
  onExpand,
}: {
  eventKey: string;
  isOpen: boolean;
  onExpand: (noteid: string) => void;
}) {
  const Icon = isOpen ? UpOutlined : DownOutlined;
  return (
    <Icon
      style={{
        position: "absolute",
        right: 10,
        margin: 0,
        padding: 10,
        // TODO and onHover styles
      }}
      onClick={(e) => {
        e.stopPropagation();
        onExpand(eventKey);
      }}
    />
  );
}

function MenuView({
  roots,
  expandKeys,
  onExpand,
  onSelect,
}: {
  roots: DataNode[];
  expandKeys: string[];
  onSelect: (noteId: string) => void;
  onExpand: (noteId: string) => void;
}) {
  const createMenu = (menu: DataNode) => {
    if (menu.children && menu.children.length > 0) {
      return (
        <SubMenu
          key={menu.key}
          title={menu.title}
          onTitleClick={(event) => onSelect(event.key)}
          // @ts-ignore -- `onExpand` gets forwared to `expandIcon` but is not part of the SubMenuProps
          onExpand={onExpand}
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
      openKeys={expandKeys}
      selectedKeys={expandKeys}
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
