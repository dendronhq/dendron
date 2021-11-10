import { DownOutlined, RightOutlined, UpOutlined } from "@ant-design/icons";
import BookOutlined from "@ant-design/icons/lib/icons/BookOutlined";
import NumberOutlined from "@ant-design/icons/lib/icons/NumberOutlined";
import PlusOutlined from "@ant-design/icons/lib/icons/PlusOutlined";
import {
  NoteProps,
  NotePropsDict,
  NoteUtils,
  TAGS_HIERARCHY_BASE,
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-frontend";
import { Menu, Typography } from "antd";
import _ from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { useDendronRouter } from "../utils/hooks";
import { SectionsData } from "../utils/types";

const { SubMenu } = Menu;

function MenuIcon(props: { note: Partial<NoteProps>; notes: NotePropsDict }) {
  const { note, notes } = props;
  let icon;
  if (note.schema) {
    icon = <BookOutlined />;
  } else if (note.fname === TAGS_HIERARCHY_BASE) {
    icon = <NumberOutlined />;
  } else if (note.stub) {
    icon = <PlusOutlined />;
  } else {
    icon = null;
  }

  if (note.fname?.startsWith(TAGS_HIERARCHY_BASE)) {
    icon = (
      <NumberOutlined
        style={{
          color: NoteUtils.color({ fname: note.fname, notes }).color,
        }}
      />
    );
  }

  return icon;
}

export default function DendronTreeMenu(
  props: { notes: SectionsData } & {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
  }
) {
  const logger = createLogger("DendronTreeView");
  const dendronRouter = useDendronRouter();
  const { changeActiveNote } = dendronRouter;
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);
  const { notes, collapsed, setCollapsed } = props;

  const expandKeys = _.isEmpty(activeNoteIds) ? [] : activeNoteIds;

  // --- Methods
  const onSelect = (noteId: string) => {
    setCollapsed(true);
    logger.info({ ctx: "onSelect", id: noteId });
    changeActiveNote(noteId);
  };

  const roots = useMemo(
    () => Object.keys(notes?.domains).map((x: string) => notes.domains[x]),
    [notes.domains]
  );

  const submenu = useMemo(
    () => Object.keys(notes?.notes).map((x: string) => notes.notes[x]),
    [notes.notes]
  );

  return (
    <MenuView
      roots={roots}
      submenu={notes.notes}
      onSelect={onSelect}
      collapsed={collapsed}
      activeNote="123"
    />
  );
}

function MenuView({
  roots,
  submenu,
  onSelect,
  collapsed,
  activeNote,
}: {
  roots: Partial<NoteProps>[];
  submenu: SectionsData["notes"];
  onSelect: (noteId: string) => void;
  collapsed: boolean;
  activeNote: string | undefined;
}) {
  const [current, setCurrent] = useState<string[]>([""]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const { getActiveNoteId } = useDendronRouter();
  const noteActive = useMemo(() => getActiveNoteId(), [getActiveNoteId]);

  const noteParents = useCallback(
    () =>
      NoteUtils.getNoteWithParents({
        note: submenu[noteActive as string] as NoteProps,
        notes: submenu as NotePropsDict,
      }),
    [noteActive, submenu]
  );

  const parentsArray = useMemo(
    () => noteParents().map((parents) => parents.id),
    [noteParents]
  );

  useEffect(() => {
    if (noteActive) {
      setCurrent([noteActive]);
      setOpenKeys(parentsArray);
    }
  }, [noteActive, parentsArray]);

  useEffect(() => {
    setExpandedKeys(parentsArray);
  }, [parentsArray]);

  const ExpandIcon = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ isOpen }: { isOpen: boolean }) => {
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

  const createMenu = useMemo(
    () => (menu: Partial<NoteProps>) => {
      if (menu?.children && menu?.children?.length > 0) {
        return (
          <SubMenu
            icon={<MenuIcon note={menu} notes={submenu as NotePropsDict} />}
            className={
              menu.id === activeNote ? "dendron-ant-menu-submenu-selected" : ""
            }
            key={menu.id}
            title={
              <Typography.Text
                style={{ width: "100%" }}
                ellipsis={{ tooltip: menu.title }}
              >
                {menu.title}
              </Typography.Text>
            }
            onTitleClick={(event) => {
              const target = event.domEvent.target as HTMLElement;
              const isArrow = target.dataset.expandedicon;
              if (!isArrow) {
                onSelect(event.key);
              }
            }}
          >
            {menu.children.map((childMenu) => {
              return createMenu(submenu[childMenu]);
            })}
          </SubMenu>
        );
      }
      return (
        <Menu.Item
          key={menu.id}
          icon={<MenuIcon note={menu} notes={submenu as NotePropsDict} />}
        >
          <Typography.Text
            style={{ width: "100%" }}
            ellipsis={{ tooltip: menu.title }}
          >
            {menu.title}
          </Typography.Text>
        </Menu.Item>
      );
    },
    [activeNote, onSelect, submenu]
  );

  const rootSubmenuKeys = roots.map((root) => root.id);

  const onOpenChange = (keys: string[]) => {
    const latestOpenKey = keys.find(
      (key: string) => openKeys.indexOf(key) === -1
    );
    if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  return expandedKeys ? (
    <Menu
      key={String(collapsed)}
      className="dendron-tree-menu"
      mode="inline"
      selectedKeys={current}
      openKeys={openKeys.length ? openKeys : undefined}
      defaultOpenKeys={expandedKeys}
      onOpenChange={onOpenChange}
      onClick={({ key }) => {
        setCurrent([key]);
        onSelect(key);
      }}
      inlineIndent={DENDRON_STYLE_CONSTANTS.SIDER.INDENT}
      expandIcon={ExpandIcon}
    >
      {roots.map((menu) => {
        return createMenu(menu);
      })}
    </Menu>
  ) : null;
}
