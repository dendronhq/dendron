import _ from "lodash";
import { z } from "zod";
import { DendronError, NoteUtils } from "..";
import { TAGS_HIERARCHY, TAGS_HIERARCHY_BASE } from "../constants";
import { NotePropsByIdDict, NoteProps, RespV3 } from "../types";
import { VaultUtils } from "../vault";
import { assertUnreachable } from "../error";
import type { Sidebar, SidebarItem } from "../sidebar";

type TreeMenuNodeIcon = "bookOutlined" | "numberOutlined" | "plusOutlined";

export type TreeMenuNode = {
  key: string;
  title: string;
  icon: TreeMenuNodeIcon | null;
  hasTitleNumberOutlined: boolean;
  vaultName: string;
  children?: TreeMenuNode[];
  contextValue?: string;
};

const treeMenuNodeSchema: z.ZodType<TreeMenuNode> = z.lazy(() =>
  z.object({
    key: z.string(),
    title: z.string(),
    icon: z
      .union([
        z.literal("bookOutlined"),
        z.literal("numberOutlined"),
        z.literal("plusOutlined"),
      ])
      .nullable(),
    hasTitleNumberOutlined: z.boolean(),
    vaultName: z.string(),
    children: z.array(treeMenuNodeSchema),
    contextValue: z.string().optional(),
  })
);

export const treeMenuSchema = z.object({
  roots: z.array(treeMenuNodeSchema),
  child2parent: z.record(z.string().nullable()),
  notesLabelById: z.record(z.string()).optional(), // cheap acces to note labels when computing breadcrumps (TODO improve `TreeMenu` datastructure so that this field is not necessary)
});

export type TreeMenu = z.infer<typeof treeMenuSchema>;

export enum TreeViewItemLabelTypeEnum {
  title = "title",
  filename = "filename",
}

export type TreeNode = {
  fname: string;
  children: TreeNode[];
};

export class TreeUtils {
  static generateTreeData(
    noteDict: NotePropsByIdDict,
    sidebar: Sidebar
  ): TreeMenu {
    function itemToNoteId(item: SidebarItem) {
      const { type } = item;
      switch (type) {
        case "category": {
          return item.link?.id;
        }
        case "note": {
          return item.id;
        }
        default:
          assertUnreachable(type);
      }
    }

    function itemToTreeMenuNode(
      sidebarItem: SidebarItem,
      opts: {
        child2parent: Record<string, string | null>;
        parent: string | null;
        notesLabelById: Record<string, string>;
      }
    ): TreeMenuNode | undefined {
      const { child2parent, parent, notesLabelById } = opts;

      const noteId = itemToNoteId(sidebarItem);
      const note = noteDict[noteId] as NoteProps | undefined; // explicitly casting since `noUncheckedIndexedAccess` is currently not enabled

      if (_.isUndefined(note)) {
        return undefined;
      }

      let icon = null;

      if (note.schema) {
        icon = "bookOutlined";
      } else if (note.fname.toLowerCase() === TAGS_HIERARCHY_BASE) {
        icon = "numberOutlined";
      } else if (note.stub) {
        icon = "plusOutlined";
      }
      const title = sidebarItem.label ?? note.title;

      notesLabelById[note.id] = title;

      const treeMenuNode: TreeMenuNode = {
        key: note.id,
        title,
        icon,
        hasTitleNumberOutlined: note.fname.startsWith(TAGS_HIERARCHY),
        vaultName: VaultUtils.getName(note.vault),
        children: [],
      };

      if (child2parent[note.id] === undefined) {
        child2parent[note.id] = parent;
      }

      if (sidebarItem.type === "category") {
        treeMenuNode.children = sidebarItem.items
          .map((item) =>
            itemToTreeMenuNode(item, {
              child2parent,
              parent: note.id,
              notesLabelById,
            })
          )
          .filter((maybeTreeMenuNode): maybeTreeMenuNode is TreeMenuNode =>
            Boolean(maybeTreeMenuNode)
          );
      }

      return treeMenuNode;
    }

    const child2parent: { [key: string]: string | null } = {};
    const notesLabelById: { [key: string]: string } = {};

    const roots = sidebar
      .map((sidebarItem) =>
        itemToTreeMenuNode(sidebarItem, {
          child2parent,
          parent: null,
          notesLabelById,
        })
      )
      .filter((maybeTreeMenuNode): maybeTreeMenuNode is TreeMenuNode =>
        Boolean(maybeTreeMenuNode)
      );

    return {
      roots,
      child2parent,
      notesLabelById,
    };
  }

  static getAllParents = ({
    child2parent,
    noteId,
  }: {
    child2parent: { [key: string]: string | null };
    noteId: string;
  }) => {
    const activeNoteIds: string[] = [];
    let parent = child2parent[noteId];
    while (parent) {
      activeNoteIds.unshift(parent);
      parent = child2parent[parent];
    }

    return activeNoteIds;
  };

  static sortNotesAtLevel = ({
    noteIds,
    noteDict,
    reverse,
    labelType,
  }: {
    noteIds: string[];
    noteDict: NotePropsByIdDict;
    reverse?: boolean;
    labelType?: TreeViewItemLabelTypeEnum;
  }): { data: string[]; error?: DendronError } => {
    const unsafeNoteIds: string[] = [];
    const safeNoteIds = noteIds.filter((noteId) => {
      const props = _.get(noteDict, noteId);
      if (props === undefined) {
        unsafeNoteIds.push(noteId);
        return false;
      } else {
        return true;
      }
    });

    let error: DendronError | undefined;
    if (unsafeNoteIds.length > 0) {
      error = new DendronError({
        message: "Omitted sorting note ids not found in noteDict",
        payload: { omitted: unsafeNoteIds },
      });
    }

    const getNoteTitleOrError = (note: NoteProps) => {
      const { error } = NoteUtils.validate(note);
      if (!error) {
        return note.title.toLowerCase();
      } else {
        return `_BAD NOTE TITLE: ${note.fname}`;
      }
    };

    const out = _.sortBy(
      safeNoteIds,
      // Sort by nav order if set
      (noteId) => noteDict[noteId]?.custom?.nav_order,
      // Sort by label
      (noteId) => {
        if (labelType) {
          return labelType === TreeViewItemLabelTypeEnum.filename
            ? _.last(noteDict[noteId]?.fname.split("."))?.toLowerCase()
            : getNoteTitleOrError(noteDict[noteId]);
        } else {
          return getNoteTitleOrError(noteDict[noteId]);
        }
      },
      // If titles are identical, sort by last updated date
      (noteId) => noteDict[noteId]?.updated
    );
    // bubble down tags hierarchy if nav_order is not set
    const maybeTagsHierarchy = out.find(
      (noteId) => noteDict[noteId].fname === TAGS_HIERARCHY_BASE
    );
    if (
      maybeTagsHierarchy &&
      noteDict[maybeTagsHierarchy].custom?.nav_order === undefined
    ) {
      const idx = out.indexOf(maybeTagsHierarchy);
      out.splice(idx, 1);
      out.push(maybeTagsHierarchy);
    }
    if (reverse) {
      return { data: _.reverse(out), error };
    }

    return { data: out, error };
  };

  /**
   * Create tree starting from given root note. Use note's children properties to define TreeNode children relationship
   *
   * @param allNotes
   * @param rootNoteId
   * @returns
   */
  static createTreeFromEngine(
    allNotes: NotePropsByIdDict,
    rootNoteId: string
  ): TreeNode {
    const note = allNotes[rootNoteId];

    if (note) {
      const children = note.children
        .filter((child) => child !== note.id)
        .sort((a, b) => a.localeCompare(b))
        .map((note) => this.createTreeFromEngine(allNotes, note));

      const fnames = note.fname.split(".");
      return { fname: fnames[fnames.length - 1], children };
    } else {
      throw new DendronError({
        message: `No note found in engine for "${rootNoteId}"`,
      });
    }
  }

  /**
   * Create tree from list of file names. Use the delimiter "." to define TreeNode children relationship
   */
  static createTreeFromFileNames(fNames: string[], rootNote: string) {
    const result: TreeNode[] = [];
    fNames.forEach((name) => {
      if (name !== rootNote) {
        name.split(".").reduce(
          (object, fname) => {
            let item = (object.children = object.children || []).find(
              (q: { fname: string }) => q.fname === fname
            );
            if (!item) {
              object.children.push((item = { fname, children: [] }));
            }
            return item;
          },
          { children: result }
        );
      }
    });
    return { fname: rootNote, children: result };
  }

  /**
   * Check if two trees are equal.
   * Two trees are equal if and only if fnames are equal and children tree nodes are equal
   */
  static validateTreeNodes(
    expectedTree: TreeNode,
    actualTree: TreeNode
  ): RespV3<void> {
    if (expectedTree.fname !== actualTree.fname) {
      return {
        error: new DendronError({
          message: `Fname differs. Expected: "${expectedTree.fname}". Actual "${actualTree.fname}"`,
        }),
      };
    }

    expectedTree.children.sort((a, b) => a.fname.localeCompare(b.fname));
    actualTree.children.sort((a, b) => a.fname.localeCompare(b.fname));

    if (expectedTree.children.length !== actualTree.children.length) {
      const expectedChildren = expectedTree.children.map(
        (child) => child.fname
      );
      const actualChildren = actualTree.children.map((child) => child.fname);
      return {
        error: new DendronError({
          message: `Mismatch at ${expectedTree.fname}'s children. Expected: "${expectedChildren}". Actual "${actualChildren}"`,
        }),
      };
    }

    for (const [idx, value] of expectedTree.children.entries()) {
      const resp = this.validateTreeNodes(value, actualTree.children[idx]);
      if (resp.error) {
        return {
          error: new DendronError({
            message: `Mismatch at ${expectedTree.fname}'s children. ${resp.error.message}.`,
          }),
        };
      }
    }
    return { data: undefined };
  }
}
