import {
  assertUnreachable,
  BacklinkPanelSortOrder,
  DateFormatUtil,
  DendronASTDest,
  EngineEventEmitter,
  NoteUtils,
  ProcFlavor,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
import { MDUtilsV5 } from "@dendronhq/unified";
import * as Sentry from "@sentry/node";
import fs from "fs";
import _, { Dictionary } from "lodash";
import path from "path";
import {
  CancellationToken,
  Disposable,
  Event,
  EventEmitter,
  MarkdownString,
  ProviderResult,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  Uri,
  window,
} from "vscode";
import { DendronContext, DENDRON_COMMANDS, ICONS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { findReferencesById, FoundRefT, sortPaths } from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { Backlink, BacklinkTreeItemType } from "./Backlink";

/**
 * Provides the data to support the backlinks tree view panel
 */
export default class BacklinksTreeDataProvider
  implements TreeDataProvider<Backlink>, Disposable
{
  private readonly MAX_LINES_OF_CONTEX̣T = 10;
  private readonly FRONTMATTER_TAG_CONTEXT_PLACEHOLDER =
    "_Link is a Frontmatter Tag_";

  private _onDidChangeTreeDataEmitter: EventEmitter<
    Backlink | undefined | void
  >;
  private _onEngineNoteStateChangedDisposable: Disposable | undefined;
  private _onDidChangeActiveTextEditorDisposable: Disposable | undefined;
  private _engineEvents;
  private _sortOrder: BacklinkPanelSortOrder | undefined = undefined;
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
    engineEvents: EngineEventEmitter,
    isLinkCandidateEnabled: boolean | undefined
  ) {
    this._isLinkCandidateEnabled = isLinkCandidateEnabled;

    // Set default sort order to use last updated
    this.sortOrder =
      MetadataService.instance().BacklinksPanelSortOrder ??
      BacklinkPanelSortOrder.LastUpdated;

    this._onDidChangeTreeDataEmitter = new EventEmitter<
      Backlink | undefined | void
    >();

    this.onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;
    this._engineEvents = engineEvents;
    this.setupSubscriptions();
  }

  /**
   * How items are sorted in the backlink panel
   */
  public get sortOrder(): BacklinkPanelSortOrder {
    return this._sortOrder!;
  }

  /**
   * Update the sort order of the backlinks panel. This will also save the
   * update into metadata service for persistence.
   */
  public set sortOrder(sortOrder: BacklinkPanelSortOrder) {
    if (sortOrder !== this._sortOrder) {
      this._sortOrder = sortOrder;

      VSCodeUtils.setContextStringValue(
        DendronContext.BACKLINKS_SORT_ORDER,
        sortOrder
      );

      this.refreshBacklinks();

      // Save the setting update into persistance storage:
      MetadataService.instance().BacklinksPanelSortOrder = sortOrder;
    }
  }

  public getTreeItem(element: Backlink) {
    try {
      return element;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

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

  public async getChildren(element?: Backlink): Promise<Backlink[]> {
    try {
      // TODO: Make the backlinks panel also work when preview is the active editor.
      const activeNote = await WSUtilsV2.instance().getActiveNote();

      if (!activeNote) {
        return [];
      }

      if (!element) {
        // Root case, branch will get top level backlinks.
        return this.getAllBacklinkedNotes(
          activeNote.id,
          this._isLinkCandidateEnabled,
          this._sortOrder!
        );
      } else {
        // 2nd-level children, which contains line-level references belonging to
        // a single note
        const refs = element?.refs;
        if (!refs) {
          return [];
        }

        return this.getAllBacklinksInNoteFromRefs(
          refs,
          activeNote.fname,
          element
        );
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Implementing this method allows us to asynchronously calculate hover
   * contents ONLY when the user actually hovers over an item. Lazy loading this
   * data allows us to speed up the initial load time of the backlinks panel.
   * @param _item
   * @param element
   * @param _token
   * @returns
   */
  public resolveTreeItem(
    _item: TreeItem,
    element: Backlink,
    _token: CancellationToken
  ): ProviderResult<TreeItem> {
    // This method implies that an item was hovered over
    AnalyticsUtils.track(VSCodeEvents.BacklinksPanelUsed, {
      type: "ItemHoverDisplayed",
      state: element.treeItemType,
    });

    if (
      element.treeItemType === BacklinkTreeItemType.noteLevel &&
      element.refs
    ) {
      return new Promise<TreeItem>((resolve) => {
        this.getTooltipForNoteLevelTreeItem(element.refs!).then((tooltip) => {
          resolve({
            tooltip,
          });
        });
      });
    } else if (element.treeItemType === BacklinkTreeItemType.referenceLevel) {
      return new Promise<TreeItem>((resolve) => {
        if (element.singleRef?.isFrontmatterTag) {
          resolve({
            tooltip: new MarkdownString(
              this.FRONTMATTER_TAG_CONTEXT_PLACEHOLDER
            ),
          });
        }
        this.getSurroundingContextForRef(
          element.singleRef!,
          this.MAX_LINES_OF_CONTEX̣T
        ).then((value) => {
          const tooltip = new MarkdownString();
          tooltip.appendMarkdown(value);

          tooltip.supportHtml = true;
          tooltip.isTrusted = true;
          tooltip.supportThemeIcons = true;

          resolve({
            tooltip,
          });
        });
      });
    } else {
      return undefined;
    }
  }

  public dispose(): void {
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
   * Tells VSCode to refresh the backlinks view. Debounced to fire every 250 ms
   */
  private refreshBacklinks = _.debounce(() => {
    this._onDidChangeTreeDataEmitter.fire();
  }, 250);

  /**
   * Takes found references corresponding to a single note and turn them into
   * TreeItems
   * @param refs list of found references (for a single note)
   * @param fsPath fsPath of current note
   * @param parent parent backlink of these refs.
   * @returns list of TreeItems of found references
   */
  private getAllBacklinksInNoteFromRefs = (
    refs: FoundRefT[],
    fsPath: string,
    parent: Backlink
  ) => {
    return refs.map((ref) => {
      const lineNum = ref.location.range.start.line;
      const backlink = Backlink.createRefLevelBacklink(ref);

      backlink.iconPath = ref.isCandidate
        ? new ThemeIcon(ICONS.LINK_CANDIDATE)
        : new ThemeIcon(ICONS.WIKILINK);
      backlink.parentBacklink = parent;
      backlink.description = `on line ${lineNum + 1}`;

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
   * Return the array of notes that have backlinks to the current note ID as
   * Backlink TreeItem objects
   * @param noteId - note ID for which to get backlinks for
   * @param isLinkCandidateEnabled
   * @param sortOrder
   * @returns
   */
  private async getAllBacklinkedNotes(
    noteId: string,
    isLinkCandidateEnabled: boolean | undefined,
    sortOrder: BacklinkPanelSortOrder
  ): Promise<Backlink[]> {
    const references = await findReferencesById({
      id: noteId,
      isLinkCandidateEnabled,
    });
    const referencesByPath = _.groupBy(
      // Exclude self-references:
      _.filter(references, (ref) => ref.note?.id !== noteId),
      ({ location }) => location.uri.fsPath
    );

    let pathsSorted: string[];
    if (sortOrder === BacklinkPanelSortOrder.PathNames) {
      pathsSorted = this.shallowFirstPathSort(referencesByPath);
    } else if (sortOrder === BacklinkPanelSortOrder.LastUpdated) {
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

    const out = pathsSorted.map((pathParam) => {
      const references = referencesByPath[pathParam];

      const backlink = Backlink.createNoteLevelBacklink(
        path.basename(pathParam, path.extname(pathParam)),
        references
      );

      const totalCount = references.length;
      const linkCount = references.filter((ref) => !ref.isCandidate).length;
      const candidateCount = isLinkCandidateEnabled
        ? totalCount - linkCount
        : 0;

      const backlinkCount = isLinkCandidateEnabled
        ? references.length
        : references.filter((ref) => !ref.isCandidate).length;

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

      backlink.description = description;

      backlink.command = {
        command: DENDRON_COMMANDS.GOTO_BACKLINK.key,
        arguments: [
          Uri.file(pathParam),
          { selection: references[0].location.range },
          false,
        ],
        title: "Open File",
      };

      return backlink;
    });
    return _.filter(out, (item) => !_.isUndefined(item)) as Backlink[];
  }

  private shallowFirstPathSort(
    referencesByPath: Dictionary<[unknown, ...unknown[]]>
  ) {
    return sortPaths(Object.keys(referencesByPath), {
      shallowFirst: true,
    });
  }

  /**
   * This tooltip will return a markdown string that has several components:
   * 1. A header section containing title, created, and updated times
   * 2. A concatenated list of references with some lines of surrounding context
   *    for each one.
   * @param references
   * @returns
   */
  private async getTooltipForNoteLevelTreeItem(
    references: FoundRefT[]
  ): Promise<MarkdownString> {
    // Shoot for around a max of 40 lines to render in the hover, otherwise,
    // it's a bit too long. Note, this doesn't take into account note reference
    // length, so those can potentially blow up the size of the context.
    // Factoring in note ref length can be a later enhancement
    let linesOfContext = 0;

    switch (references.length) {
      case 1: {
        linesOfContext = this.MAX_LINES_OF_CONTEX̣T;
        break;
      }
      case 2: {
        linesOfContext = 7;
        break;
      }
      case 3: {
        linesOfContext = 5;
        break;
      }
      default:
        linesOfContext = 3;
        break;
    }

    const markdownBlocks = await Promise.all(
      references.map(async (foundRef) => {
        // Just use a simple place holder if it's a frontmatter tag instead of
        // trying to render context
        if (foundRef.isFrontmatterTag) {
          return {
            content: this.FRONTMATTER_TAG_CONTEXT_PLACEHOLDER,
            isCandidate: false,
          };
        }

        return {
          content: (await this.getSurroundingContextForRef(
            foundRef,
            linesOfContext
          ))!,
          isCandidate: foundRef.isCandidate,
        };
      })
    );

    const tooltip = new MarkdownString();
    tooltip.isTrusted = true;
    tooltip.supportHtml = true;
    tooltip.supportThemeIcons = true;

    const noteProps = references[0].note;

    if (noteProps) {
      tooltip.appendMarkdown(
        `## ${noteProps.title}
_created: ${DateFormatUtil.formatDate(noteProps.created)}_<br>
_updated: ${DateFormatUtil.formatDate(noteProps.updated)}_`
      );
      tooltip.appendMarkdown("<hr/>");
    }

    let curLinkCount = 1;
    let curCandidateCount = 1;

    for (const block of markdownBlocks) {
      let header;
      if (block.isCandidate) {
        header = `\n\n**CANDIDATE ${curCandidateCount}**<br>`;
        curCandidateCount += 1;
      } else {
        header = `\n\n**LINK ${curLinkCount}**<br>`;
        curLinkCount += 1;
      }

      tooltip.appendMarkdown(header);
      tooltip.appendMarkdown(block.content);
      tooltip.appendMarkdown("<hr/>");
    }

    return tooltip;
  }

  private async getSurroundingContextForRef(
    ref: FoundRefT,
    linesOfContext: number
  ): Promise<string> {
    const proc = MDUtilsV5.procRemarkFull(
      {
        noteToRender: ref.note,
        fname: ref.note.fname,
        vault: ref.note.vault,
        dest: DendronASTDest.MD_REGULAR,
        backlinkHoverOpts: {
          linesOfContext,
          location: {
            start: {
              line: ref.location.range.start.line + 1, // 1 indexed
              column: ref.location.range.start.character + 1, // 1 indexed
            },
            end: {
              line: ref.location.range.end.line + 1,
              column: ref.location.range.end.character + 1,
            },
          },
        },
        config: DConfig.readConfigSync(
          ExtensionProvider.getDWorkspace().wsRoot,
          true
        ),
      },
      {
        flavor: ProcFlavor.BACKLINKS_PANEL_HOVER,
      }
    );

    const note = ref.note!;

    const fsPath = NoteUtils.getFullPath({
      note,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });

    const fileContent = fs.readFileSync(fsPath).toString();

    return (await proc.process(fileContent)).toString();
  }
}
