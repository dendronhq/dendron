import {
  assertUnreachable,
  DateFormatUtil,
  DendronASTDest,
  DendronError,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  VaultUtils,
} from "@dendronhq/common-all";
import { EngineEventEmitter } from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import _, { Dictionary } from "lodash";
import path from "path";
import {
  CancellationToken,
  Disposable,
  Event,
  EventEmitter,
  MarkdownString,
  ProviderResult,
  Range,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window,
} from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DendronContext, DENDRON_COMMANDS, ICONS } from "../constants";
import { Logger } from "../logger";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { BacklinkSortOrder } from "../types";
import {
  containsMarkdownExt,
  findReferences,
  FoundRefT,
  getSurroundingContextForNoteRef,
  sortPaths,
} from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { Backlink, BacklinkFoundRef } from "./Backlink";

export default class BacklinksTreeDataProvider
  implements TreeDataProvider<Backlink>, Disposable
{
  private _onDidChangeTreeDataEmitter: EventEmitter<
    Backlink | undefined | void
  >;
  private _onEngineNoteStateChangedDisposable: Disposable | undefined;
  private _onDidChangeActiveTextEditorDisposable: Disposable | undefined;
  private _engineEvents;
  private _sortOrder: BacklinkSortOrder = BacklinkSortOrder.PathNames;
  readonly _isLinkCandidateEnabled: boolean | undefined;

  /**
   * Signals to vscode UI engine that the backlinks view needs to be refreshed.
   */
  readonly onDidChangeTreeData: Event<Backlink | undefined | void>;

  /**
   *
   * @param engineEvents - specifies when note state has been changed on the
   * engine
   */
  constructor(
    private _engine: IEngineAPIService,
    engineEvents: EngineEventEmitter,
    isLinkCandidateEnabled: boolean | undefined
  ) {
    this._isLinkCandidateEnabled = isLinkCandidateEnabled;
    this.updateSortOrder(BacklinkSortOrder.PathNames);

    this._onDidChangeTreeDataEmitter = new EventEmitter<
      Backlink | undefined | void
    >();

    this.onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;
    this._engineEvents = engineEvents;
    this.setupSubscriptions();
  }

  dispose(): void {
    if (this._onDidChangeTreeDataEmitter) {
      this._onDidChangeTreeDataEmitter.dispose();
    }
    if (this._onEngineNoteStateChangedDisposable) {
      this._onEngineNoteStateChangedDisposable.dispose();
    }
    if (this._onDidChangeActiveTextEditorDisposable) {
      this._onDidChangeActiveTextEditorDisposable.dispose();
    }
  }

  private setupSubscriptions(): void {
    this._onDidChangeActiveTextEditorDisposable =
      window.onDidChangeActiveTextEditor(() => {
        const ctx = "refreshBacklinksChangeActiveTextEditor";
        Logger.info({ ctx });
        this.refreshBacklinks();
      });

    this._onEngineNoteStateChangedDisposable =
      this._engineEvents.onEngineNoteStateChanged(() => {
        const ctx = "refreshBacklinksEngineNoteStateChanged";
        Logger.info({ ctx });
        this.refreshBacklinks();
      });
  }

  /**
   * Tells VSCode to refresh the backlinks view. Debounced to fire every 100 ms
   */
  private refreshBacklinks = _.debounce(() => {
    this._onDidChangeTreeDataEmitter.fire();
  }, 250);

  // This fn is invoked by vscode as part of the TreeDataProvider interface, so
  // report errors to Sentry in the catch block
  public getTreeItem(element: Backlink) {
    try {
      return element;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  // This fn is invoked by vscode as part of the TreeDataProvider interface, so
  // report errors to Sentry in the catch block
  public getParent(element: Backlink): ProviderResult<Backlink> {
    try {
      if (element.parentBacklink) {
        return element.parentBacklink;
      } else {
        return undefined;
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  public updateSortOrder(sortOrder: BacklinkSortOrder) {
    this._sortOrder = sortOrder;

    VSCodeUtils.setContextStringValue(
      DendronContext.BACKLINKS_SORT_ORDER,
      sortOrder
    );

    this.refreshBacklinks();
  }

  // This fn is invoked by vscode as part of the TreeDataProvider interface, so
  // report errors to Sentry in the catch block
  public async getChildren(element?: Backlink) {
    try {
      // TODO: Make the backlinks panel also work when preview is the active editor.
      const fsPath = window.activeTextEditor?.document.uri.fsPath;

      if (!element) {
        // Root case, branch will get top level backlinks.
        // Top level children/1st-level children.
        if (!fsPath || (fsPath && !containsMarkdownExt(fsPath))) {
          return [];
        }
        return this.pathsToBacklinkSourceTreeItems(
          fsPath,
          this._isLinkCandidateEnabled,
          this._sortOrder
        );
      } else {
        // 3rd-level children.
        const refs = element?.refs;
        if (!refs) {
          return [];
        }

        if (!this._isLinkCandidateEnabled && element.label === "Candidates") {
          return [];
        }
        return this.refsToBacklinkTreeItems(refs, fsPath!, element);
      }

      // else {
      //   // 2nd-level children.
      //   const refs = element?.refs;
      //   if (!refs) {
      //     return [];
      //   }
      //   return this.getSecondLevelRefsToBacklinks(refs);
      // }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  resolveTreeItem(
    _item: TreeItem,
    element: Backlink,
    _token: CancellationToken
  ): ProviderResult<TreeItem> {
    return this.getMarkdownPreviewString(element.label).then((tooltip) => {
      return {
        tooltip: new MarkdownString(tooltip),
      };
    });
  }

  /**
   * Given all the found references to this note, return tree item(s) showing
   * the type of backlinks. If `isLinkCandidateEnabled` is not set, the tree
   * item will not be added regardless of the existence of link candidates.
   * @param refs list of found references to this note
   * @returns list of tree item(s) for the type of backlinks
   */
  public getSecondLevelRefsToBacklinks = (
    refs: BacklinkFoundRef[]
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
        TreeItemCollapsibleState.Collapsed
      );
      backlinkTreeItem.parentBacklink = wikilinks[0].parentBacklink;
      backlinkTreeItem.iconPath = new ThemeIcon(ICONS.WIKILINK);

      const updatedString =
        wikilinks[0].note !== undefined
          ? `, note updated: ${DateFormatUtil.formatDate(
              wikilinks[0].note.updated
            )}`
          : ``;

      backlinkTreeItem.description = `${wikilinks.length} link(s)${updatedString}`;
      out.push(backlinkTreeItem);
    }
    if (this._isLinkCandidateEnabled) {
      const candidateCount = linkCandidates.length;
      if (candidateCount > 0) {
        const candidateTreeItem = new Backlink(
          "Candidates",
          linkCandidates,
          TreeItemCollapsibleState.Collapsed
        );
        candidateTreeItem.parentBacklink = linkCandidates[0].parentBacklink;
        candidateTreeItem.iconPath = new ThemeIcon(ICONS.LINK_CANDIDATE);
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
  private refsToBacklinkTreeItems = (
    refs: FoundRefT[],
    fsPath: string,
    parent: Backlink
  ) => {
    return refs.map((ref) => {
      const lineNum = ref.location.range.start.line;
      const backlink = new Backlink(
        ref.matchText,
        undefined,
        TreeItemCollapsibleState.None
      );

      backlink.iconPath = ref.isCandidate
        ? new ThemeIcon(ICONS.LINK_CANDIDATE)
        : new ThemeIcon(ICONS.WIKILINK);
      backlink.parentBacklink = parent;
      backlink.description = `on line ${lineNum + 1}`;

      backlink.tooltip = new MarkdownString(
        getSurroundingContextForNoteRef(ref, 5)
      );

      backlink.command = {
        command: DENDRON_COMMANDS.GOTO_BACKLINK.key,
        arguments: [
          ref.location.uri,
          { selection: ref.location.range },
          ref.isCandidate ?? false,
        ],
        title: "Open File",
      };
      if (ref.isCandidate) {
        backlink.command = {
          command: "dendron.convertCandidateLink",
          title: "Convert Candidate Link",
          arguments: [
            { location: ref.location, text: path.parse(fsPath).name },
          ],
        };
      }
      return backlink;
    });
  };

  /**
   * Given the fsPath of current note, return the list of backlink sources as tree view items.
   * @param fsPath fsPath of current note
   * @returns list of the source of the backlinks as TreeItems
   */
  private pathsToBacklinkSourceTreeItems = async (
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
      pathsSorted = this.shallowFirstPathSort(referencesByPath);
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
    } else assertUnreachable(sortOrder);

    if (!pathsSorted.length) {
      return [];
    }

    const collapsibleState = TreeItemCollapsibleState.Collapsed;

    const out = pathsSorted.map((pathParam) => {
      const backlink = new Backlink(
        _.trimEnd(path.basename(pathParam), path.extname(pathParam)),
        referencesByPath[pathParam],
        collapsibleState
      );

      const totalCount = referencesByPath[pathParam].length;
      const linkCount = referencesByPath[pathParam].filter(
        (ref) => !ref.isCandidate
      ).length;
      const candidateCount = isLinkCandidateEnabled
        ? totalCount - linkCount
        : 0;

      const backlinkCount = isLinkCandidateEnabled
        ? referencesByPath[pathParam].length
        : referencesByPath[pathParam].filter((ref) => !ref.isCandidate).length;

      if (backlinkCount === 0) return undefined;

      let linkCountDescription;

      if (linkCount === 1) {
        linkCountDescription = "1 link";
      } else if (linkCount > 1) {
        linkCountDescription = `${linkCount} links`;
      }

      let candidateCountDescription;

      if (candidateCount === 1) {
        candidateCountDescription = "1 candidate";
      } else if (candidateCount > 1) {
        candidateCountDescription = `${candidateCountDescription} candidates`;
      }

      const description = _.compact([
        linkCountDescription,
        candidateCountDescription,
      ]).join(", ");

      const updatedTime = referencesByPath[pathParam][0].note?.updated;
      const suffix =
        updatedTime !== undefined
          ? `. Note updated: ${DateFormatUtil.formatDate(updatedTime)}`
          : ``;

      backlink.description = `${description}${suffix}`;

      backlink.command = {
        command: DENDRON_COMMANDS.GOTO_BACKLINK.key,
        arguments: [
          Uri.file(pathParam),
          { selection: new Range(0, 0, 0, 0) },
          false,
        ],
        title: "Open File",
      };
      return backlink;
    });
    return _.filter(out, (item) => !_.isUndefined(item)) as Backlink[];
  };

  private shallowFirstPathSort(
    referencesByPath: Dictionary<[unknown, ...unknown[]]>
  ) {
    return sortPaths(Object.keys(referencesByPath), {
      shallowFirst: true,
    });
  }

  private async getMarkdownPreviewString(
    fname: string
  ): Promise<string | undefined> {
    const ctx = "";
    // Check if what's being referenced is a note.
    let note: NoteProps;
    const maybeNotes = NoteUtils.getNotesByFnameFromEngine({
      fname,
      engine: this._engine,
    });
    if (maybeNotes.length === 0) {
      return;
    } else if (maybeNotes.length > 1) {
      // If there are multiple notes with this fname, default to one that's in the same vault first.
      const currentVault = PickerUtilsV2.getVaultForOpenEditor();
      const sameVaultNote = _.filter(maybeNotes, (note) =>
        VaultUtils.isEqual(note.vault, currentVault, this._engine.wsRoot)
      )[0];
      if (!_.isUndefined(sameVaultNote)) {
        // There is a note that's within the same vault, let's go with that.
        note = sameVaultNote;
      } else {
        // Otherwise, just pick one, doesn't matter which.
        note = maybeNotes[0];
      }
    } else {
      // Just 1 note, use that.
      note = maybeNotes[0];
    }

    // For notes, let's use the noteRef functionality to render the referenced portion.
    const referenceText = ["![["];
    // if (vaultName) referenceText.push(`dendron://${vaultName}/`);
    referenceText.push(fname);

    referenceText.push("]]");
    const reference = referenceText.join("");
    // now we create a fake note so we can pass this to the engine
    const id = `note.id-${reference}`;
    const fakeNote = NoteUtils.createForFake({
      // Mostly same as the note...
      fname: note.fname,
      vault: note.vault,
      // except the changed ID to avoid caching
      id,
      // And using the reference as the text of the note
      contents: reference,
    });
    const rendered = await this._engine.renderNote({
      id: fakeNote.id,
      note: fakeNote,
      dest: DendronASTDest.MD_REGULAR,
      flavor: ProcFlavor.HOVER_PREVIEW,
    });
    if (rendered.error) {
      const error =
        rendered.error instanceof DendronError
          ? rendered.error
          : new DendronError({
              message: "Error while rendering backlinks hover",
              payload: rendered.error,
            });
      Sentry.captureException(error);
      Logger.error({
        ctx,
        msg: "Error while rendering the backlinks hover",
        error,
      });
    }
    if (rendered.data) {
      return rendered.data;
    }
    return;
  }
}
