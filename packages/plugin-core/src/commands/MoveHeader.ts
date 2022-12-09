import {
  asyncLoopOneAtATime,
  DendronASTDest,
  DendronError,
  DLink,
  DNodeUtils,
  DNoteHeaderAnchor,
  DNoteLink,
  DVault,
  ErrorUtils,
  ERROR_SEVERITY,
  extractNoteChangeEntryCounts,
  getSlugger,
  DendronConfig,
  isNotUndefined,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VaultUtils,
  ConfigService,
  URI,
  NoteQuickInputV2,
} from "@dendronhq/common-all";
import { file2Note, vault2Path } from "@dendronhq/common-server";
import { Heading, HistoryEvent, Node } from "@dendronhq/engine-server";
import {
  MDUtilsV5,
  Processor,
  DendronASTNode,
  DendronASTTypes,
  MdastUtils,
  RemarkUtils,
  Anchor,
  AnchorUtils,
  LinkUtils,
} from "@dendronhq/unified";
import _ from "lodash";
import path from "path";
import visit from "unist-util-visit";
import { Disposable, Location } from "vscode";
import {
  ILookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3Interface";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { NotePickerUtils } from "../components/lookup/NotePickerUtils";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { delayedUpdateDecorations } from "../features/windowDecorations";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { AutoCompleter } from "../utils/autoCompleter";
import { findReferences, FoundRefT, hasAnchorsToUpdate } from "../utils/md";
import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandInput =
  | {
      nonInteractive?: boolean;
      useSameVault?: boolean;
    }
  | undefined;
type CommandOpts = {
  dest?: NoteProps;
  origin: NoteProps;
  nodesToMove: Node[];
  engine: IEngineAPIService;
} & CommandInput;
type CommandOutput = {
  changed: NoteChangeEntry[];
} & CommandOpts;

export class MoveHeaderCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.MOVE_HEADER.key;

  private headerNotSelectedError = new DendronError({
    message: "You must first select the header you want to move.",
    severity: ERROR_SEVERITY.MINOR,
  });

  private noActiveNoteError = new DendronError({
    message: "No note open.",
    severity: ERROR_SEVERITY.MINOR,
  });

  private noNodesToMoveError = new DendronError({
    message:
      "There are no nodes to move. If your selection is valid, try again after reloading VSCode.",
    severity: ERROR_SEVERITY.MINOR,
  });

  private noDestError = new DendronError({
    message: "No destination provided.",
    severity: ERROR_SEVERITY.MINOR,
  });

  private getProc = (note: NoteProps, config: DendronConfig) => {
    return MDUtilsV5.procRemarkFull({
      noteToRender: note,
      fname: note.fname,
      vault: note.vault,
      dest: DendronASTDest.MD_DENDRON,
      config,
    });
  };

  /**
   * Helper for {@link MoveHeaderCommand.gatherInputs}
   * Validates and processes inputs to be passed for further action
   * @returns {}
   */
  private async validateAndProcessInput(config: DendronConfig): Promise<{
    proc: Processor;
    origin: NoteProps;
    targetHeader: Heading;
    targetHeaderIndex: number;
  }> {
    const { editor, selection } = VSCodeUtils.getSelection();

    // basic input validation
    if (!editor) throw this.noActiveNoteError;
    if (!selection) throw this.headerNotSelectedError;

    const line = editor.document.lineAt(selection.start.line).text;
    const maybeNote = await ExtensionProvider.getWSUtils().getNoteFromDocument(
      editor.document
    );
    if (!maybeNote) {
      throw this.noActiveNoteError;
    }

    // parse selection and get the target header node
    const proc = this.getProc(maybeNote, config);

    // TODO: shoudl account for line number
    const bodyAST: DendronASTNode = proc.parse(
      maybeNote.body
    ) as DendronASTNode;

    const parsedLine = proc.parse(line);
    let targetHeader: Heading | undefined;
    let targetIndex: number | undefined;
    // Find the first occurring heading node in selected line.
    // This should be our target.
    visit(parsedLine, [DendronASTTypes.HEADING], (heading: Heading, index) => {
      targetHeader = heading;
      targetIndex = index;
      return false;
    });
    if (!targetHeader || _.isUndefined(targetIndex)) {
      throw this.headerNotSelectedError;
    }

    const resp = MdastUtils.findHeader({
      nodes: bodyAST.children,
      match: targetHeader,
    });
    if (!resp) {
      throw Error("did not find header");
    }
    return {
      proc,
      origin: maybeNote,
      targetHeader,
      targetHeaderIndex: resp.index,
    };
  }

  /**
   * Helper for {@link MoveHeaderCommand.gatherInputs}
   * Prompts user to do a lookup on the desired destination.
   * @param opts
   * @returns
   */
  private promptForDestination(
    lookupController: ILookupControllerV3,
    opts: CommandInput
  ) {
    const extension = ExtensionProvider.getExtension();
    const lookupProvider = extension.noteLookupProviderFactory.create(
      this.key,
      {
        allowNewNote: true,
        noHidePickerOnAccept: false,
      }
    );

    lookupController.show({
      title: "Select note to move header to",
      placeholder: "note",
      provider: lookupProvider,
      initialValue: NotePickerUtils.getInitialValueFromOpenEditor(),
      nonInteractive: opts?.nonInteractive,
    });
    return lookupController;
  }

  /**
   * Get the destination note given a quickpick and the selected item.
   * @param opts
   * @returns
   */
  async prepareDestination(opts: {
    engine: IEngineAPIService;
    quickpick: DendronQuickPickerV2;
    selectedItems: readonly NoteQuickInputV2[];
  }) {
    const { engine, quickpick, selectedItems } = opts;
    const vault =
      (quickpick.vault as DVault) ||
      (await PickerUtilsV2.getVaultForOpenEditor());
    let dest: NoteProps | undefined;
    if (_.isUndefined(selectedItems)) {
      dest = undefined;
    } else {
      const selected = selectedItems[0];
      const isCreateNew = PickerUtilsV2.isCreateNewNotePicked(selected);
      if (isCreateNew) {
        // check if we really want to create a new note.
        // if a user selects a vault in the picker that
        // already has the note, we should not create a new one.
        const fname = selected.fname;
        const maybeNote = (await engine.findNotes({ fname, vault }))[0];
        if (_.isUndefined(maybeNote)) {
          dest = NoteUtils.create({ fname, vault });
        } else {
          dest = maybeNote;
        }
      } else {
        const resp = await engine.getNote(selected.id);
        if (resp.error) {
          this.L.error({ error: resp.error });
          return;
        }
        dest = resp.data;
      }
    }
    return dest;
  }

  async gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined> {
    // validate and process input
    const engine = ExtensionProvider.getEngine();
    const { wsRoot } = engine;

    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;

    const { proc, origin, targetHeader, targetHeaderIndex } =
      await this.validateAndProcessInput(config);

    // extract nodes that need to be moved
    const originTree = proc.parse(origin.body);
    const nodesToMove = RemarkUtils.extractHeaderBlock(
      originTree,
      targetHeader.depth,
      targetHeaderIndex
    );

    if (nodesToMove.length === 0) {
      throw this.noNodesToMoveError;
    }

    const lcOpts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: opts?.useSameVault,
      vaultSelectCanToggle: false,
    };
    const lc =
      await ExtensionProvider.getExtension().lookupControllerFactory.create(
        lcOpts
      );
    return new Promise((resolve) => {
      let disposable: Disposable;
      NoteLookupProviderUtils.subscribe({
        id: this.key,
        controller: lc,
        logger: this.L,
        onDone: async (event: HistoryEvent) => {
          const data = event.data as NoteLookupProviderSuccessResp;
          const quickpick: DendronQuickPickerV2 = lc.quickPick;
          const dest = await this.prepareDestination({
            engine,
            quickpick,
            selectedItems: data.selectedItems,
          });
          resolve({
            dest,
            origin,
            nodesToMove,
            engine,
          });
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
      });
      this.promptForDestination(lc, opts);

      VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

      disposable = AutoCompletableRegistrar.OnAutoComplete(() => {
        if (lc.quickPick) {
          lc.quickPick.value = AutoCompleter.getAutoCompletedValue(
            lc.quickPick
          );

          lc.provider.onUpdatePickerItems({
            picker: lc.quickPick,
          });
        }
      });
    });
  }

  /**
   * Helper for {@link MoveHeaderCommand.execute}
   * Given a list of nodes to move, appends them to the destination
   * @param engine
   * @param dest
   * @param nodesToMove
   */
  private async appendHeaderToDestination(opts: {
    engine: IEngineAPIService;
    dest: NoteProps;
    origin: NoteProps;
    nodesToMove: Node[];
  }): Promise<void> {
    const { engine, dest, origin, nodesToMove } = opts;
    // find where the extracted block starts and ends
    const startOffset = nodesToMove[0].position?.start.offset;
    const endOffset = _.last(nodesToMove)!.position?.end.offset;

    const originBody = origin.body;
    const destContentToAppend = originBody.slice(startOffset, endOffset);

    // add the stringified blocks to destination note body
    dest.body = `${dest.body}\n\n${destContentToAppend}`;
    await engine.writeNote(dest);
  }

  /**
   * Helper for {@link MoveHeaderCommand.execute}
   * given a copy of origin, and the modified content of origin,
   * find the difference and return the updated anchor names
   * @param originDeepCopy
   * @param modifiedOriginContent
   * @returns anchorNamesToUpdate
   */
  private findAnchorNamesToUpdate(
    originDeepCopy: NoteProps,
    modifiedOriginContent: string
  ): string[] {
    const anchorsBefore = RemarkUtils.findAnchors(originDeepCopy.body);
    const anchorsAfter = RemarkUtils.findAnchors(modifiedOriginContent);
    const anchorsToUpdate = _.differenceWith(
      anchorsBefore,
      anchorsAfter,
      RemarkUtils.hasIdenticalChildren
    );
    const anchorNamesToUpdate = _.map(anchorsToUpdate, (anchor: Anchor) => {
      const slugger = getSlugger();
      const payload = AnchorUtils.anchorNode2anchor(anchor, slugger);
      return payload![0];
    });
    return anchorNamesToUpdate;
  }

  /**
   * Helper for {@link MoveHeaderCommand.updateReferences}
   * Given a {@link Location}, find the respective note.
   * @param location
   * @param engine
   * @returns note
   */
  private async getNoteByLocation(
    location: Location,
    engine: IEngineAPIService
  ): Promise<NoteProps | undefined> {
    const fsPath = location.uri.fsPath;
    const fname = NoteUtils.normalizeFname(path.basename(fsPath));

    const vault = await ExtensionProvider.getWSUtils().getVaultFromUri(
      location.uri
    );
    return (await engine.findNotes({ fname, vault }))[0];
  }

  /**
   * Helper for {@link MoveHeaderCommand.updateReferences}
   * Given an note, origin note, and a list of anchor names,
   * return all links that should be updated in {@link note},
   * is a descending order of location offset.
   * @param note
   * @param engine
   * @param origin
   * @param anchorNamesToUpdate
   * @returns
   */
  private findLinksToUpdate(
    note: NoteProps,
    origin: NoteProps,
    anchorNamesToUpdate: string[],
    config: DendronConfig
  ) {
    const links = LinkUtils.findLinksFromBody({
      note,
      config,
    }).filter((link) => {
      return (
        link.to?.fname?.toLowerCase() === origin.fname.toLowerCase() &&
        link.to?.anchorHeader &&
        anchorNamesToUpdate.includes(link.to.anchorHeader)
      );
    });

    // modify it from the bottom
    // to avoid dealing with offsetting locations
    const linksToUpdate = _.orderBy(
      links,
      (link: DLink) => {
        return link.position?.start.offset;
      },
      "desc"
    );

    return linksToUpdate;
  }

  /**
   * Helper for {@link MoveHeaderCommand.updateReferences}
   * Given a note that has links to update, and a list of links,
   * modify the note's body to have updated links.
   * @param note Note that has links to update
   * @param linksToUpdate list of links to update
   * @param dest Note that was the destination of move header commnad
   * @returns
   */
  async updateLinksInNote(opts: {
    note: NoteProps;
    engine: IEngineAPIService;
    linksToUpdate: DLink[];
    dest: NoteProps;
  }) {
    const { note, engine, linksToUpdate, dest } = opts;
    const notesWithSameName = await engine.findNotesMeta({ fname: dest.fname });
    return _.reduce(
      linksToUpdate,
      (note: NoteProps, linkToUpdate: DLink) => {
        const oldLink = LinkUtils.dlink2DNoteLink(linkToUpdate);

        // original link had vault prefix?
        //   keep it
        // original link didn't have vault prefix?
        //   add vault prefix if there are notes with same name in other vaults.
        //   don't add otherwise.
        const isXVault = oldLink.data.xvault || notesWithSameName.length > 1;
        const newLink = {
          ...oldLink,
          from: {
            ...oldLink.from,
            fname: dest.fname,
            vaultName: VaultUtils.getName(dest.vault),
          },
          data: {
            xvault: isXVault,
          },
        } as DNoteLink;
        const newBody = LinkUtils.updateLink({
          note: note!,
          oldLink,
          newLink,
        });
        note.body = newBody;
        return note;
      },
      note
    );
  }

  /**
   * Helper for {@link MoveHeaderCommand.execute}
   * Given a list of found references, update those references
   * so that they point to the correct header in a destination note.
   * @param foundReferences
   * @param anchorNamesToUpdate
   * @param engine
   * @param origin
   * @param dest
   * @returns updated
   */
  async updateReferences(
    foundReferences: FoundRefT[],
    anchorNamesToUpdate: string[],
    engine: IEngineAPIService,
    config: DendronConfig,
    origin: NoteProps,
    dest: NoteProps
  ): Promise<NoteChangeEntry[]> {
    let noteChangeEntries: NoteChangeEntry[] = [];
    const ctx = `${this.key}:updateReferences`;
    const refsToProcess = (
      await Promise.all(
        foundReferences
          .filter((ref) => !ref.isCandidate)
          .filter((ref) => hasAnchorsToUpdate(ref, anchorNamesToUpdate))
          .map((ref) => this.getNoteByLocation(ref.location, engine))
      )
    ).filter(isNotUndefined);

    await asyncLoopOneAtATime(refsToProcess, async (note) => {
      try {
        const vaultPath = vault2Path({
          vault: note.vault,
          wsRoot: engine.wsRoot,
        });
        const resp = file2Note(
          path.join(vaultPath, note.fname + ".md"),
          note!.vault
        );
        if (ErrorUtils.isErrorResp(resp)) {
          throw new Error();
        }
        const _note = resp.data;
        const linksToUpdate = this.findLinksToUpdate(
          _note,
          origin,
          anchorNamesToUpdate,
          config
        );
        const modifiedNote = await this.updateLinksInNote({
          note: _note,
          engine,
          linksToUpdate,
          dest,
        });
        note.body = modifiedNote.body;
        const writeResp = await engine.writeNote(note);
        if (writeResp.data) {
          noteChangeEntries = noteChangeEntries.concat(writeResp.data);
        }
      } catch (error) {
        // TODO: should notify which one we failed during update.
        this.L.error({ ctx, error });
      }
    });
    return noteChangeEntries;
  }

  /**
   * Helper for {@link MoveHeaderCommand.execute}
   * Given a origin note and a list of nodes to move,
   * remove the nodes from the origin's note body
   * and return the modified origin content rendered as string
   * @param origin origin note
   * @param nodesToMove nodes that will be moved
   * @param engine
   * @returns
   */
  async removeBlocksFromOrigin(
    origin: NoteProps,
    nodesToMove: Node[],
    engine: IEngineAPIService
  ) {
    // find where the extracted block starts and ends
    const startOffset = nodesToMove[0].position?.start.offset;
    const endOffset = _.last(nodesToMove)!.position?.end.offset;

    // remove extracted blocks
    const originBody = origin.body;
    const modifiedOriginContent = [
      originBody.slice(0, startOffset),
      originBody.slice(endOffset),
    ].join("");

    origin.body = modifiedOriginContent;

    await engine.writeNote(origin);

    return modifiedOriginContent;
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "MoveHeaderCommand";
    this.L.info({ ctx, opts });
    const { origin, nodesToMove, engine } = opts;
    const { wsRoot } = engine;

    const dest = opts.dest as NoteProps;

    if (_.isUndefined(dest)) {
      // we failed to get a destination. exit.
      throw this.noDestError;
    }

    // deep copy the origin before mutating it
    const originDeepCopy = _.cloneDeep(origin);

    // remove blocks from origin
    const modifiedOriginContent = await this.removeBlocksFromOrigin(
      origin,
      nodesToMove,
      engine
    );

    // append header to destination
    await this.appendHeaderToDestination({
      engine,
      dest,
      origin: originDeepCopy,
      nodesToMove,
    });

    delayedUpdateDecorations();

    // update all references to old block
    const anchorNamesToUpdate = this.findAnchorNamesToUpdate(
      originDeepCopy,
      modifiedOriginContent
    );
    const foundReferences = await findReferences(origin.fname);

    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;

    const updated = await this.updateReferences(
      foundReferences,
      anchorNamesToUpdate,
      engine,
      config,
      origin,
      dest
    );

    return { ...opts, changed: updated };
  }

  trackProxyMetrics({
    out,
    noteChangeEntryCounts,
  }: {
    out: CommandOutput;
    noteChangeEntryCounts: {
      createdCount: number;
      deletedCount: number;
      updatedCount: number;
    };
  }) {
    const extension = ExtensionProvider.getExtension();
    const engine = extension.getEngine();
    const { vaults } = engine;

    // only look at origin note
    const { origin } = out;

    const headers = _.toArray(origin.anchors).filter((anchor) => {
      return anchor !== undefined && anchor.type === "header";
    }) as DNoteHeaderAnchor[];

    const numOriginHeaders = headers.length;
    const originHeaderDepths = headers.map((header) => header.depth);
    const maxOriginHeaderDepth = _.max(originHeaderDepths);
    const meanOriginHeaderDepth = _.mean(originHeaderDepths);
    const movedHeaders = out.nodesToMove.filter((node) => {
      return node.type === "heading";
    }) as Heading[];
    const numMovedHeaders = movedHeaders.length;
    const movedHeaderDepths = movedHeaders.map((header) => header.depth);
    const maxMovedHeaderDepth = _.max(movedHeaderDepths);
    const meanMovedHeaderDepth = _.mean(movedHeaderDepths);

    ProxyMetricUtils.trackRefactoringProxyMetric({
      props: {
        command: this.key,
        numVaults: vaults.length,
        traits: origin.traits || [],
        numChildren: origin.children.length,
        numLinks: origin.links.length,
        numChars: origin.body.length,
        noteDepth: DNodeUtils.getDepth(origin),
      },
      extra: {
        ...noteChangeEntryCounts,
        numOriginHeaders,
        maxOriginHeaderDepth,
        meanOriginHeaderDepth,
        numMovedHeaders,
        maxMovedHeaderDepth,
        meanMovedHeaderDepth,
      },
    });
  }

  addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput) {
    const noteChangeEntryCounts =
      out !== undefined
        ? { ...extractNoteChangeEntryCounts(out.changed) }
        : {
            createdCount: 0,
            updatedCount: 0,
            deletedCount: 0,
          };

    try {
      this.trackProxyMetrics({ out, noteChangeEntryCounts });
    } catch (error) {
      this.L.error({ error });
    }

    return noteChangeEntryCounts;
  }
}
