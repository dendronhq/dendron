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
import { UpOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React, { useState, useEffect, useCallback } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useDendronRouter } from "../utils/hooks";
import { DendronCommonProps, NoteData, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";

const { SubMenu } = Menu;

export default function DendronTreeMenu(
  props: Partial<NoteData> & { collapsed: boolean }
) {
  const logger = createLogger("DendronTreeView");
  const dendronRouter = useDendronRouter();
  const { changeActiveNote } = dendronRouter;
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);
  const noteActiveId = _.isUndefined(dendronRouter.query.id)
    ? props.noteIndex?.id
    : dendronRouter.query.id;

  // set `activeNoteIds`
  useEffect(() => {
    if (!verifyNoteData(props) || !noteActiveId) {
      return undefined;
    }

    logger.info({
      state: "useEffect:preCalculateTree",
    });

    const activeNoteIds = TreeViewUtils.getAllParents({
      notes: props.notes,
      noteId: noteActiveId,
    });

    setActiveNoteIds(activeNoteIds);
  }, [props.notes, props.noteIndex, dendronRouter.query.id, noteActiveId]);

  // --- Verify
  if (!verifyNoteData(props)) {
    logger.info({
      state: "exit:notes not initialized",
    });
    return <DendronSpinner />;
  }

  const { notes, domains, noteIndex, collapsed } = props;

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
    changeActiveNote(noteId, { noteIndex: props.noteIndex });
  };

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

  return (
    <MenuView
      roots={roots}
      expandKeys={expandKeys}
      onSelect={onSelect}
      onExpand={onExpand}
      collapsed={collapsed}
      activeNote={noteActiveId}
    />
  );
}

function MenuView({
  roots,
  expandKeys,
  onSelect,
  onExpand,
  collapsed,
  activeNote,
}: {
  roots: DataNode[];
  expandKeys: string[];
  onSelect: (noteId: string) => void;
  onExpand: (noteId: string) => void;
  collapsed: boolean;
  activeNote: string | undefined;
}) {
  const ExpandIcon = useCallback(
    ({ isOpen, ...rest }: { isOpen: boolean }) => {
      const UncollapsedIcon = isOpen ? UpOutlined : DownOutlined;
      const Icon = collapsed ? RightOutlined : UncollapsedIcon;
      return (
        <i data-expandedicon="true">
          <Icon
            style={{
              pointerEvents: "none", // only allow custom element to be gesture target
              margin: 0,
            }}
          />
        </i>
      );
    },
    [collapsed]
  );

  const createMenu = (menu: DataNode) => {
    if (menu.children && menu.children.length > 0) {
      return (
        <SubMenu
          icon={menu.icon}
          className={
            menu.key === activeNote ? "dendron-ant-menu-submenu-selected" : ""
          }
          key={menu.key}
          title={menu.title}
          onTitleClick={(event) => {
            const target = event.domEvent.target as HTMLElement;
            const isArrow = target.dataset.expandedicon;
            if (!isArrow) {
              onSelect(event.key);
            } else {
              onExpand(event.key);
            }
          }}
        >
          {menu.children.map((childMenu: DataNode) => {
            return createMenu(childMenu);
          })}
        </SubMenu>
      );
    }
    return (
      <Menu.Item key={menu.key} icon={menu.icon}>
        {menu.title}
      </Menu.Item>
    );
  };

  return (
    <Menu
      key={String(collapsed)}
      mode="inline"
      {...(!collapsed && {
        openKeys: expandKeys,
        selectedKeys: expandKeys,
      })}
      onClick={({ key }) => onSelect(key)}
      inlineIndent={DENDRON_STYLE_CONSTANTS.SIDER.INDENT}
      expandIcon={ExpandIcon}
      inlineCollapsed={collapsed}
    >
      {roots.map((menu) => {
        return createMenu(menu);
      })}
    </Menu>
  );
}
