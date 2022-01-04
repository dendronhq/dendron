import {
  DendronError,
  DLink,
  DNoteLink,
  DVault,
  ERROR_SEVERITY,
  getSlugger,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { file2Note, vault2Path } from "@dendronhq/common-server";
import {
  Anchor,
  AnchorUtils,
  DendronASTDest,
  DendronASTTypes,
  Heading,
  HistoryEvent,
  LinkUtils,
  MDUtilsV5,
  Node,
  Processor,
  RemarkUtils,
  visit,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { Location } from "vscode";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import {
  NoteLookupProviderUtils,
  PickerUtilsV2,
} from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { delayedUpdateDecorations } from "../features/windowDecorations";
import { VSCodeUtils } from "../vsCodeUtils";
import { findReferences, FoundRefT } from "../utils/md";
import { getVaultFromUri } from "../workspace";
import { WSUtils } from "../WSUtils";
import { BasicCommand } from "./base";
import { ExtensionProvider } from "../ExtensionProvider";
import {
  ILookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3Interface";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";

type CommandInput =
  | {
      initialValue?: string;
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
  updated: NoteProps[];
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

  private getProc = (engine: IEngineAPIService, note: NoteProps) => {
    return MDUtilsV5.procRemarkFull({
      engine,
      fname: note.fname,
      vault: note.vault,
      dest: DendronASTDest.MD_DENDRON,
    });
  };

  /**
   * Helper for {@link MoveHeaderCommand.gatherInputs}
   * Validates and processes inputs to be passed for further action
   * @param engine
   * @returns {}
   */
  private validateAndProcessInput(engine: IEngineAPIService): {
    proc: Processor;
    origin: NoteProps;
    targetHeader: Heading;
  } {
    const { editor, selection } = VSCodeUtils.getSelection();

    // basic input validation
    if (!editor) throw this.noActiveNoteError;
    if (!selection) throw this.headerNotSelectedError;

    const line = editor.document.lineAt(selection.start.line).text;
    const maybeNote = WSUtils.getNoteFromDocument(editor.document);
    if (!maybeNote) {
      throw this.noActiveNoteError;
    }

    // parse selection and get the target header node
    const proc = this.getProc(engine, maybeNote);
    const parsedLine = proc.parse(line);
    let targetHeader: Heading | undefined;
    // Find the first occurring heading node in selected line.
    // This should be our target.
    visit(parsedLine, [DendronASTTypes.HEADING], (heading: Heading) => {
      targetHeader = heading;
      return false;
    });
    if (!targetHeader) {
      throw this.headerNotSelectedError;
    }
    return { proc, origin: maybeNote, targetHeader };
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
      initialValue: opts?.initialValue,
      nonInteractive: opts?.nonInteractive,
    });
    return lookupController;
  }

  /**
   * Get the destination note given a quickpick and the selected item.
   * @param opts
   * @returns
   */
  prepareDestination(opts: {
    engine: IEngineAPIService;
    quickpick: DendronQuickPickerV2;
    selectedItems: readonly NoteQuickInput[];
  }) {
    const { engine, quickpick, selectedItems } = opts;
    const vault =
      (quickpick.vault as DVault) || PickerUtilsV2.getVaultForOpenEditor();
    let dest: NoteProps | undefined;
    if (_.isUndefined(selectedItems)) {
      dest = undefined;
    } else {
      const selected = selectedItems[0];
      const isCreateNew = PickerUtilsV2.isCreateNewNotePick(selected);
      if (isCreateNew) {
        // check if we really want to create a new note.
        // if a user selects a vault in the picker that
        // already has the note, we should not create a new one.
        const fname = selected.fname;
        const maybeNote = NoteUtils.getNoteByFnameFromEngine({
          fname,
          engine,
          vault, // this is the vault selected from the vault picker
        });
        if (_.isUndefined(maybeNote)) {
          dest = NoteUtils.create({ fname, vault });
        } else {
          dest = maybeNote;
        }
      } else {
        dest = selected as NoteProps;
      }
    }
    return dest;
  }

  async gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined> {
    // validate and process input
    const engine = ExtensionProvider.getEngine();
    const { proc, origin, targetHeader } = this.validateAndProcessInput(engine);

    // extract nodes that need to be moved
    const originTree = proc.parse(origin.body);
    const nodesToMove = RemarkUtils.extractHeaderBlock(
      originTree,
      targetHeader
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
      ExtensionProvider.getExtension().lookupControllerFactory.create(lcOpts);
    return new Promise((resolve) => {
      NoteLookupProviderUtils.subscribe({
        id: this.key,
        controller: lc,
        logger: this.L,
        onDone: (event: HistoryEvent) => {
          const data = event.data as NoteLookupProviderSuccessResp;
          const quickpick: DendronQuickPickerV2 = lc.quickpick;
          const dest = this.prepareDestination({
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
        },
      });
      this.promptForDestination(lc, opts);
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
    await engine.writeNote(dest, {
      updateExisting: true,
    });
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
  private getNoteByLocation(
    location: Location,
    engine: IEngineAPIService
  ): NoteProps | undefined {
    const fsPath = location.uri.fsPath;
    const fname = NoteUtils.normalizeFname(path.basename(fsPath));

    const vault = getVaultFromUri(location.uri);
    const note = NoteUtils.getNoteByFnameFromEngine({
      fname,
      engine,
      vault,
    });
    return note;
  }

  /**
   * Helper for {@link MoveHeaderCommand.updateReferences}
   * Given a {@link FoundRefT} and a list of anchor names,
   * check if ref contains an anchor name to update.
   * @param ref
   * @param anchorNamesToUpdate
   * @returns
   */
  private hasAnchorsToUpdate(ref: FoundRefT, anchorNamesToUpdate: string[]) {
    const matchText = ref.matchText;
    const wikiLinkRegEx = /\[\[(?<text>.+?)\]\]/;

    const wikiLinkMatch = wikiLinkRegEx.exec(matchText);

    if (wikiLinkMatch && wikiLinkMatch.groups?.text) {
      let processed = wikiLinkMatch.groups.text;
      if (processed.includes("|")) {
        const [_alias, link] = processed.split("|");
        processed = link;
      }

      if (processed.includes("#")) {
        const [_fname, anchor] = processed.split("#");
        return anchorNamesToUpdate.includes(anchor);
      } else {
        return false;
      }
    } else {
      return false;
    }
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
    engine: IEngineAPIService,
    origin: NoteProps,
    anchorNamesToUpdate: string[]
  ) {
    const links = LinkUtils.findLinks({
      note,
      engine,
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
  updateLinksInNote(opts: {
    note: NoteProps;
    engine: IEngineAPIService;
    linksToUpdate: DLink[];
    dest: NoteProps;
  }) {
    const { note, engine, linksToUpdate, dest } = opts;
    return _.reduce(
      linksToUpdate,
      (note: NoteProps, linkToUpdate: DLink) => {
        const oldLink = LinkUtils.dlink2DNoteLink(linkToUpdate);
        const notesWithSameName = NoteUtils.getNotesByFnameFromEngine({
          fname: dest.fname,
          engine,
        });

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
    origin: NoteProps,
    dest: NoteProps
  ): Promise<NoteProps[]> {
    const updated: NoteProps[] = [];
    foundReferences
      .filter((ref) => !ref.isCandidate)
      .filter((ref) => this.hasAnchorsToUpdate(ref, anchorNamesToUpdate))
      .map((ref) => this.getNoteByLocation(ref.location, engine))
      .filter((note) => note !== undefined)
      .forEach(async (note) => {
        const vaultPath = vault2Path({
          vault: note!.vault,
          wsRoot: engine.wsRoot,
        });
        const _note = file2Note(
          path.join(vaultPath, note!.fname + ".md"),
          note!.vault
        );
        const linksToUpdate = this.findLinksToUpdate(
          _note,
          engine,
          origin,
          anchorNamesToUpdate
        );
        const modifiedNote = this.updateLinksInNote({
          note: _note,
          engine,
          linksToUpdate,
          dest,
        });
        note!.body = modifiedNote.body;
        const writeResp = await engine.writeNote(note!, {
          updateExisting: true,
        });
        updated.push(writeResp.data[0].note);
      });
    return updated;
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

    await engine.writeNote(origin, {
      updateExisting: true,
    });

    return modifiedOriginContent;
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "MoveHeaderCommand";
    this.L.info({ ctx, opts });
    const { origin, nodesToMove, engine } = opts;
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
    const updated = await this.updateReferences(
      foundReferences,
      anchorNamesToUpdate,
      engine,
      origin,
      dest
    );
    return { ...opts, updated };
  }
}
