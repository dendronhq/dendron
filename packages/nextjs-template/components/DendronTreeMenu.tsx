import { DownOutlined, RightOutlined, UpOutlined } from "@ant-design/icons";
import { TreeUtils } from "@dendronhq/common-all";
import { createLogger, TreeViewUtils } from "@dendronhq/common-frontend";
import { Typography } from "antd";
import _ from "lodash";
import dynamic from "next/dynamic";
import Link from "next/link";
import { DataNode } from "rc-tree/lib/interface";
import React, { useCallback, useEffect, useState } from "react";
import { useCombinedSelector } from "../features";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { useDendronRouter } from "../utils/hooks";
import { NoteData } from "../utils/types";

const Menu = dynamic(() => import("./AntdMenuWrapper"), {
  ssr: false,
});

const SubMenu = dynamic(() => import("./AntdSubMenuWrapper"), {
  ssr: false,
});

const MenuItem = dynamic(() => import("./AntdMenuItemWrapper"), {
  ssr: false,
});

export default function DendronTreeMenu(
  props: Partial<NoteData> & {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
  }
) {
  const ide = useCombinedSelector((state) => state.ide);
  const tree = ide.tree;
  const logger = createLogger("DendronTreeMenu");
  const dendronRouter = useDendronRouter();
  const { changeActiveNote } = dendronRouter;
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);
  const noteActiveId = _.isUndefined(dendronRouter.query.id)
    ? props.noteIndex?.id
    : dendronRouter.query.id;

  // set `activeNoteIds`
  useEffect(() => {
    if (!noteActiveId || !tree) {
      return undefined;
    }

    logger.info({
      state: "useEffect:preCalculateTree",
    });

    // all parents should be in expanded position
    const activeNoteIds = TreeUtils.getAllParents({
      child2parent: tree.child2parent,
      noteId: noteActiveId,
    });

    setActiveNoteIds(activeNoteIds);
  }, [props.notes, props.noteIndex, dendronRouter.query.id, noteActiveId]);

  const { notes, collapsed, setCollapsed } = props;

  const expandKeys = _.isEmpty(activeNoteIds) ? [] : activeNoteIds;
  if (!tree) {
    return null;
  }

  const roots: DataNode[] = TreeViewUtils.treeMenuNode2DataNode({
    roots: tree.roots,
    showVaultName: false,
    applyNavExclude: true,
  });

  // --- Methods
  const onSelect = (noteId: string) => {
    if (!props.noteIndex) {
      return;
    }
    setCollapsed(true);
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
      {...props}
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
  noteIndex,
}: {
  roots: DataNode[];
  expandKeys: string[];
  onSelect: (noteId: string) => void;
  onExpand: (noteId: string) => void;
  collapsed: boolean;
  activeNote: string | undefined;
} & Partial<NoteData>) {
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
          title={<MenuItemTitle menu={menu} noteIndex={noteIndex!} />}
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
      <MenuItem key={menu.key} icon={menu.icon}>
        <MenuItemTitle menu={menu} noteIndex={noteIndex!} />
      </MenuItem>
    );
  };

  if (activeNote) {
    expandKeys.push(activeNote);
  }

  return (
    <Menu
      key={String(collapsed)}
      className="dendron-tree-menu"
      mode="inline"
      {...(!collapsed && {
        openKeys: expandKeys,
        selectedKeys: expandKeys,
      })}
      inlineIndent={DENDRON_STYLE_CONSTANTS.SIDER.INDENT}
      expandIcon={ExpandIcon}
      inlineCollapsed={collapsed}
      // results in gray box otherwise when nav bar is too short for display
      style={{ height: "100%" }}
    >
      {roots.map((menu) => {
        return createMenu(menu);
      })}
    </Menu>
  );
}

function MenuItemTitle(props: Partial<NoteData> & { menu: DataNode }) {
  const { getNoteUrl } = useDendronRouter();

  return (
    <Typography.Text ellipsis={{ tooltip: props.menu.title }}>
      <Link
        href={getNoteUrl(props.menu.key as string, {
          noteIndex: props.noteIndex!,
        })}
      >
        {props.menu.title}
      </Link>
    </Typography.Text>
  );
}
