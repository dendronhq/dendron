import { FoundRefT } from "../utils/md";
import vscode, { TreeItemCollapsibleState } from "vscode";

export type BacklinkFoundRef = FoundRefT & {
  parentBacklink: Backlink | undefined;
};

export enum BacklinkTreeItemType {
  /**
   * Tree item that represents a note, which may contain several backlinks to
   * the current note (1st level)
   */
  noteLevel = "noteLevel",

  /**
   * Tree item that represents a single backlink reference (2nd level)
   */
  referenceLevel = "referenceLevel",
}

export class Backlink extends vscode.TreeItem {
  public singleRef: FoundRefT | undefined;
  public refs: BacklinkFoundRef[] | undefined;
  public parentBacklink: Backlink | undefined;

  public static createRefLevelBacklink(reference: FoundRefT): Backlink {
    return new Backlink(
      reference.matchText,
      undefined,
      TreeItemCollapsibleState.None,
      BacklinkTreeItemType.referenceLevel,
      reference
    );
  }

  public static createNoteLevelBacklink(
    label: string,
    references: FoundRefT[]
  ): Backlink {
    return new Backlink(
      label,
      references,
      TreeItemCollapsibleState.Collapsed,
      BacklinkTreeItemType.noteLevel,
      undefined
    );
  }

  private constructor(
    label: string,
    refs: FoundRefT[] | undefined,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly treeItemType: BacklinkTreeItemType,
    singleRef: FoundRefT | undefined
  ) {
    super(label, collapsibleState);

    if (refs) {
      this.refs = refs.map((r) => ({ ...r, parentBacklink: this }));
    } else {
      this.refs = undefined;
    }

    if (singleRef) {
      this.singleRef = singleRef;
    }
  }
}
