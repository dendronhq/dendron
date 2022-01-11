import vscode, { ProviderResult } from "vscode";
import path from "path";
import {
  containsMarkdownExt,
  findReferences,
  FoundRefT,
  sortPaths,
} from "../utils/md";
import _, { Dictionary } from "lodash";
import { DendronContext, ICONS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { BacklinkSortOrder } from "../types";
import { DateFormatUtil } from "@dendronhq/common-all";

export type BacklinkFoundRef = FoundRefT & {
  parentBacklink: Backlink | undefined;
};

export class Backlink extends vscode.TreeItem {
  public refs: BacklinkFoundRef[] | undefined;
  public parentBacklink: Backlink | undefined;

  constructor(
    public readonly label: string,
    refs: FoundRefT[] | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    if (refs) {
      this.refs = refs.map((r) => ({ ...r, parentBacklink: this }));
    } else {
      this.refs = undefined;
    }
  }
}

function shallowFirstPathSort(
  referencesByPath: Dictionary<[unknown, ...unknown[]]>
) {
  return sortPaths(Object.keys(referencesByPath), {
    shallowFirst: true,
  });
}

/**
 * Given the fsPath of current note, return the list of backlink sources as tree view items.
 * @param fsPath fsPath of current note
 * @returns list of the source of the backlinks as TreeItems
 */
const pathsToBacklinkSourceTreeItems = async (
  fsPath: string,
  isLinkCandidateEnabled: boolean | undefined,
  sortOrder: BacklinkSortOrder
) => {
  const fileName = path.parse(fsPath).name;
  const referencesByPath = _.groupBy(
    await findReferences(fileName, [fsPath]),
    ({ location }) => location.uri.fsPath
  );

  let pathsSorted: string[];
  if (sortOrder === BacklinkSortOrder.PathNames) {
    pathsSorted = shallowFirstPathSort(referencesByPath);
  } else if (sortOrder === BacklinkSortOrder.LastUpdated) {
    pathsSorted = Object.keys(referencesByPath).sort((p1, p2) => {
      const ref1 = referencesByPath[p1];
      const ref2 = referencesByPath[p2];

      if (
        ref1.length === 0 ||
        ref2.length === 0 ||
        ref1[0].note === undefined ||
        ref2[0].note === undefined
      ) {
        Logger.error({
          msg: "Missing info for well formed backlink sort by last updated.",
        });

        return 0;
      }

      const ref2Updated = ref2[0].note.updated;
      const ref1Updated = ref1[0].note.updated;

      // We want to sort in descending order by last updated
      return ref2Updated - ref1Updated;
    });
  } else {
    Logger.error({
      msg: `Unsupported sort order: '${sortOrder}' falling back to path sort order.`,
    });
    pathsSorted = shallowFirstPathSort(referencesByPath);
  }

  if (!pathsSorted.length) {
    return [];
  }

  const collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

  const out = pathsSorted.map((pathParam) => {
    const backlink = new Backlink(
      path.basename(pathParam),
      referencesByPath[pathParam],
      collapsibleState
    );
    const backlinkCount = isLinkCandidateEnabled
      ? referencesByPath[pathParam].length
      : referencesByPath[pathParam].filter((ref) => !ref.isCandidate).length;

    if (backlinkCount === 0) return undefined;

    backlink.description = `(${backlinkCount}) - (${path.basename(pathParam)})`;
    backlink.tooltip = pathParam;
    backlink.command = {
      command: "vscode.open",
      arguments: [
        vscode.Uri.file(pathParam),
        { selection: new vscode.Range(0, 0, 0, 0) },
      ],
      title: "Open File",
    };
    return backlink;
  });
  return _.filter(out, (item) => !_.isUndefined(item)) as Backlink[];
};

/**
 * Given all the found references to this note, return tree item(s) showing the type of backlinks.
 * If `isLinkCandidateEnabled` is set, the tree item will not be added regardless of the existence of link candidates.
 * @param refs list of found references to this note
 * @param isLinkCandidateEnabled flag that enables displaying link candidates
 * @returns list of tree item(s) for the type of backlinks
 */
export const secondLevelRefsToBacklinks = (
  refs: BacklinkFoundRef[],
  isLinkCandidateEnabled: boolean | undefined
): Backlink[] | undefined => {
  const [wikilinks, linkCandidates] = _.partition(refs, (ref) => {
    return !ref.isCandidate;
  });

  const out: Backlink[] = [];
  const wikilinksCount = wikilinks.length;
  if (wikilinksCount > 0) {
    const backlinkTreeItem = new Backlink(
      "Linked",
      wikilinks,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    backlinkTreeItem.parentBacklink = wikilinks[0].parentBacklink;
    backlinkTreeItem.iconPath = new vscode.ThemeIcon(ICONS.WIKILINK);

    const updatedString =
      wikilinks[0].note !== undefined
        ? `, note updated: ${DateFormatUtil.formatDate(
            wikilinks[0].note.updated
          )}`
        : ``;

    backlinkTreeItem.description = `${wikilinks.length} link(s)${updatedString}`;
    out.push(backlinkTreeItem);
  }
  if (isLinkCandidateEnabled) {
    const candidateCount = linkCandidates.length;
    if (candidateCount > 0) {
      const candidateTreeItem = new Backlink(
        "Candidates",
        linkCandidates,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      candidateTreeItem.parentBacklink = linkCandidates[0].parentBacklink;
      candidateTreeItem.iconPath = new vscode.ThemeIcon(ICONS.LINK_CANDIDATE);
      candidateTreeItem.description = `${linkCandidates.length} candidate(s).`;
      out.push(candidateTreeItem);
    }
  }
  if (_.isEmpty(out)) return undefined;
  return out;
};

/**
 * Takes found references and turn them into TreeItems that could be views in the TreeView
 * @param refs list of found references
 * @param fsPath fsPath of current note
 * @param parent parent backlink of these refs.
 * @returns list of TreeItems of found references
 */
const refsToBacklinkTreeItems = (
  refs: FoundRefT[],
  fsPath: string,
  parent: Backlink
) => {
  return refs.map((ref) => {
    const lineNum = ref.location.range.start.line;
    const backlink = new Backlink(
      ref.matchText,
      undefined,
      vscode.TreeItemCollapsibleState.None
    );
    backlink.parentBacklink = parent;
    backlink.description = `on line ${lineNum + 1}`;
    backlink.tooltip = ref.matchText;
    backlink.command = {
      command: "vscode.open",
      arguments: [ref.location.uri, { selection: ref.location.range }],
      title: "Open File",
    };
    if (ref.isCandidate) {
      backlink.command = {
        command: "dendron.convertCandidateLink",
        title: "Convert Candidate Link",
        arguments: [{ location: ref.location, text: path.parse(fsPath).name }],
      };
    }
    return backlink;
  });
};

export default class BacklinksTreeDataProvider
  implements vscode.TreeDataProvider<Backlink>
{
  private _sortOrder: BacklinkSortOrder = BacklinkSortOrder.PathNames;
  private _onDidChangeTreeData: vscode.EventEmitter<Backlink | undefined> =
    new vscode.EventEmitter<Backlink | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Backlink | undefined> =
    this._onDidChangeTreeData.event;
  readonly isLinkCandidateEnabled: boolean | undefined;

  constructor(isLinkCandidateEnabled: boolean | undefined) {
    this.isLinkCandidateEnabled = isLinkCandidateEnabled;

    this.updateSortOrder(BacklinkSortOrder.PathNames);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: Backlink) {
    return element;
  }

  public getParent(element: Backlink): ProviderResult<Backlink> {
    if (element.parentBacklink) {
      return element.parentBacklink;
    } else {
      return undefined;
    }
  }

  updateSortOrder(sortOrder: BacklinkSortOrder) {
    this._sortOrder = sortOrder;

    VSCodeUtils.setContextStringValue(
      DendronContext.BACKLINKS_SORT_ORDER,
      sortOrder
    );

    this.refresh();
  }

  public async getChildren(element?: Backlink) {
    const fsPath = vscode.window.activeTextEditor?.document.uri.fsPath;

    if (!element) {
      // Root case, branch will get top level backlinks.
      // Top level children/1st-level children.
      if (!fsPath || (fsPath && !containsMarkdownExt(fsPath))) {
        return [];
      }
      return pathsToBacklinkSourceTreeItems(
        fsPath,
        this.isLinkCandidateEnabled,
        this._sortOrder
      );
    } else if (element.label === "Linked" || element.label === "Candidates") {
      // 3rd-level children.
      const refs = element?.refs;
      if (!refs) {
        return [];
      }

      if (!this.isLinkCandidateEnabled && element.label === "Candidates") {
        return [];
      }
      return refsToBacklinkTreeItems(refs, fsPath!, element);
    } else {
      // 2nd-level children.
      const refs = element?.refs;
      if (!refs) {
        return [];
      }
      return secondLevelRefsToBacklinks(refs, this.isLinkCandidateEnabled);
    }
  }
}
