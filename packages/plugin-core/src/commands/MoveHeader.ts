import {
  DendronError,
  NoteProps,
  NoteUtils,
  VaultUtils,
  getSlugger,
  ERROR_SEVERITY,
  DNoteLink,
  DLink,
} from "@dendronhq/common-all";
import {
  HistoryService,
  DendronASTDest,
  DendronASTTypes,
  AnchorUtils,
  Processor,
  RemarkUtils,
  MDUtilsV5,
  visit,
  Heading,
  Node,
  Anchor,
  LinkUtils,
} from "@dendronhq/engine-server";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import {
  NoteLookupProvider,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";
import _ from "lodash";
import path from "path";
import { getEngine } from "../workspace";
import { EngineAPIService } from "../services/EngineAPIService";
import { delayedUpdateDecorations } from "../features/windowDecorations";
import { findReferences, FoundRefT } from "../utils/md";
import { Location } from "vscode";
import { file2Note, vault2Path } from "@dendronhq/common-server";

type CommandInput =
  | {
      dest?: NoteProps;
    }
  | undefined;
type CommandOpts = {
  origin: NoteProps;
  nodesToMove: Node[];
  engine: EngineAPIService;
} & CommandInput;
type CommandOutput = {
  updated: NoteProps[];
} & CommandOpts;

export class MoveHeaderCommand extends BasicCommand<CommandOpts, CommandOutput> {
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

  private getProc = (engine: EngineAPIService, note: NoteProps) => {
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
  private validateAndProcessInput(engine: EngineAPIService): {
    proc: Processor;
    origin: NoteProps;
    targetHeader: Heading;
  } {
    const { editor, selection } = VSCodeUtils.getSelection();

    // basic input validation
    if (!editor) throw this.noActiveNoteError;
    if (!selection) throw this.headerNotSelectedError;

    const line = editor.document.lineAt(selection.start.line).text;
    const maybeNote = VSCodeUtils.getNoteFromDocument(editor.document);
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
  private promptForDestination(opts: CommandInput) {
    const lookupController = LookupControllerV3.create({
      nodeType: "note",
      disableVaultSelection: true,
    });
    const lookupProvider = new NoteLookupProvider(this.key, {
      allowNewNote: false,
      noHidePickerOnAccept: false,
    });

    lookupController.show({
      title: "Select note to move header to",
      placeholder: "note",
      provider: lookupProvider,
      initialValue: opts?.dest ? opts.dest.fname : undefined,
      nonInteractive: !_.isUndefined(opts?.dest),
    });
    return lookupController;
  }

  async gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined> {
    // validate and process input
    const engine = getEngine();
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

    const lc = this.promptForDestination(opts);

    // Wait for provider
    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id: this.key,
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove(this.key, "lookupProvider");
            const cdata = event.data as NoteLookupProviderSuccessResp;
            resolve({
              dest: cdata.selectedItems[0],
              origin,
              nodesToMove,
              engine,
            });
            lc.onHide();
          } else if (event.action === "error") {
            this.L.error({ msg: `error: ${event.data}` });
            resolve(undefined);
          } else if (event.action === "changeState") {
            this.L.info({ msg: "cancelled" });
            resolve(undefined);
          } else {
            this.L.error({ msg: `unhandled error: ${event.data}` });
            resolve(undefined);
          }
        },
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
  private async appendHeaderToDestination(
    engine: EngineAPIService,
    dest: NoteProps,
    nodesToMove: Node[]
  ): Promise<void> {
    const destProc = this.getProc(engine, dest!);
    
    // make a fake tree to feed through proc.stringify
    const fakeTree = { type: "root", children: nodesToMove } as Node;
    const destContentToAppend = destProc.stringify(fakeTree);

    // add the stringified blocks to destination note body
    dest!.body = `${dest!.body}\n\n${destContentToAppend}`;
    await engine.writeNote(dest!, {
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
    engine: EngineAPIService
  ): NoteProps | undefined {
    const { wsRoot, vaults, notes } = engine;
    const fsPath = location.uri.fsPath;
    const fname = NoteUtils.normalizeFname(path.basename(fsPath));
    const vault = VaultUtils.getVaultByNotePath({
      fsPath,
      wsRoot,
      vaults,
    });
    const note = NoteUtils.getNoteByFnameV5({
      fname,
      notes,
      vault,
      wsRoot,
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
    engine: EngineAPIService,
    origin: NoteProps,
    anchorNamesToUpdate: string[]
  ) {
    

    const links = LinkUtils.findLinks({
      note,
      engine,
    }).filter((link) => {
      return (
        link.to?.fname === origin.fname &&
        link.to?.anchorHeader &&
        anchorNamesToUpdate.includes(link.to.anchorHeader)
      );
    });

    // modify it from the bottom
    // to avoid dealing with offsetting locations
    const linksToUpdate = _.orderBy(
      links,
      (link) => {
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
  private updateLinksInNote(note: NoteProps, linksToUpdate: DLink[], dest: NoteProps) {
    return _.reduce(
          
      linksToUpdate,
      (note: NoteProps, linkToUpdate: DLink) => {
        const oldLink = LinkUtils.dlink2DNoteLink(linkToUpdate);
        const newLink = {
          ...oldLink,
          from: {
            ...oldLink.from,
            fname: dest.fname,
            vaultName: VaultUtils.getName(dest.vault),
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
    engine: EngineAPIService,
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
        const modifiedNote = this.updateLinksInNote(
          _note,
          linksToUpdate,
          dest
        );
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
    engine: EngineAPIService,
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
    const {
      dest,
      origin,
      nodesToMove,
      engine,
    } = opts;
    
    // deep copy the origin before mutating it
    const originDeepCopy = _.cloneDeep(origin);

    // remove blocks from origin
    const modifiedOriginContent = await this.removeBlocksFromOrigin(
      origin,
      nodesToMove,
      engine
    );
    
    // append header to destination
    await this.appendHeaderToDestination(engine, dest!, nodesToMove);
   
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
      dest!
    );
    return { ...opts, updated };
  }
}
