import _ from "lodash";
import { DendronError } from "..";
import { TAGS_HIERARCHY, TAGS_HIERARCHY_BASE } from "../constants";
import { NotePropsByIdDict, NoteProps, RespV3 } from "../types";
import { isNotUndefined, PublishUtils } from "../utils";
import { VaultUtils } from "../vault";

export enum TreeMenuNodeIcon {
  bookOutlined = "bookOutlined",
  numberOutlined = "numberOutlined",
  plusOutlined = "plusOutlined",
}

export type TreeMenuNode = {
  key: string;
  title: string;
  icon: TreeMenuNodeIcon | null;
  hasTitleNumberOutlined: boolean;
  vaultName: string;
  navExclude: boolean;
  children?: TreeMenuNode[];
  contextValue?: string;
};

export type TreeMenu = {
  roots: TreeMenuNode[];
  child2parent: { [key: string]: string | null };
};

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
    allNotes: NotePropsByIdDict,
    domains: NoteProps[]
  ): TreeMenu {
    // --- Calc
    const roots = domains
      .map((note) => {
        return TreeUtils.note2Tree({
          noteId: note.id,
          noteDict: allNotes,
        });
      })
      .filter((ent): ent is TreeMenuNode => !_.isUndefined(ent));

    const child2parent: { [key: string]: string | null } = {};
    Object.entries(allNotes).forEach(([noteId, note]) => {
      child2parent[noteId] = note.parent;
    });

    return { roots, child2parent };
  }

  static getAllParents = ({
    child2parent,
    noteId,
  }: {
    child2parent: { [key: string]: string | null };
    noteId: string;
  }) => {
    const activeNoteIds: string[] = [noteId];
    let parent = child2parent[noteId];
    while (parent) {
      activeNoteIds.unshift(parent);
      parent = child2parent[parent];
    }

    return activeNoteIds;
  };

  static note2Tree({
    noteId,
    noteDict,
  }: {
    noteId: string;
    noteDict: NotePropsByIdDict;
  }): TreeMenuNode | undefined {
    const note = noteDict[noteId];
    const fm = PublishUtils.getPublishFM(note);

    // return children of the current note
    const getChildren = () => {
      if (fm.nav_exclude_children || fm.has_collection) {
        return [];
      }

      const { data } = this.sortNotesAtLevel({
        noteIds: note.children,
        noteDict,
        reverse: fm.sort_order === "reverse",
      });

      return data
        .map((noteId) =>
          TreeUtils.note2Tree({
            noteId,
            noteDict,
          })
        )
        .filter(isNotUndefined);
    };

    if (_.isUndefined(note)) {
      return undefined;
    }

    let icon: TreeMenuNodeIcon | null = null;
    if (note.schema) {
      icon = TreeMenuNodeIcon.bookOutlined;
    } else if (note.fname.toLowerCase() === TAGS_HIERARCHY_BASE) {
      icon = TreeMenuNodeIcon.numberOutlined;
    } else if (note.stub) {
      icon = TreeMenuNodeIcon.plusOutlined;
    }

    return {
      key: note.id,
      title: note.title,
      icon,
      hasTitleNumberOutlined: note.fname.startsWith(TAGS_HIERARCHY),
      vaultName: VaultUtils.getName(note.vault),
      navExclude: fm.nav_exclude || false,
      children: getChildren(),
    };
  }

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

    const out = _.sortBy(
      safeNoteIds,
      // Sort by nav order if set
      (noteId) => noteDict[noteId]?.custom?.nav_order,
      // Sort by label
      (noteId) => {
        if (labelType) {
          return labelType === TreeViewItemLabelTypeEnum.filename
            ? _.last(noteDict[noteId]?.fname.split("."))?.toLowerCase()
            : noteDict[noteId]?.title?.toLowerCase();
        } else {
          return noteDict[noteId]?.title?.toLowerCase();
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
