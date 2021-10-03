import {
  DendronError,
  NoteProps,
  NoteUtils,
  VaultUtils,
  getSlugger,
  ERROR_SEVERITY,
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

type CommandInput =
  | {
      dest?: NoteProps;
    }
  | undefined;
type CommandOpts = {
  origin: NoteProps;
  nodesToMove: Node[];
  modifiedOriginTree: Node;
  originProc: Processor;
  engine: EngineAPIService;
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
              modifiedOriginTree: originTree,
              originProc: proc,
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
    const destTree = destProc.parse(dest!.body);
    destTree.children = (destTree.children as Node[]).concat(nodesToMove);
    const modifiedDestContent = destProc.stringify(destTree);
    dest!.body = modifiedDestContent;
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
    const anchorNamesToUpdate = _.map(anchorsToUpdate, (anchor) => {
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
      .map((ref) => this.getNoteByLocation(ref.location, engine))
      .filter((note) => note !== undefined)
      .forEach(async (note) => {
        // find match text in note and modify the node
        const proc = this.getProc(engine, note!);
        const tree = proc.parse(note!.body);
        visit(tree, (node: Node) => {
          if (node.type === DendronASTTypes.WIKI_LINK) {
            if (
              node.value === origin.fname &&
              _.includes(anchorNamesToUpdate, node.data!.anchorHeader)
            ) {
              node.value = dest!.fname;
            }
          }
        });
        note!.body = proc.stringify(tree);
        const writeResp = await engine.writeNote(note!, {
          updateExisting: true,
        });
        updated.push(writeResp.data[0].note);
      });
    return updated;
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "MoveHeaderCommand";
    this.L.info({ ctx, opts });
    const {
      dest,
      origin,
      nodesToMove,
      modifiedOriginTree,
      originProc,
      engine,
    } = opts;

    // deep copy the origin before mutating it
    const originDeepCopy = _.cloneDeep(origin);
    // remove header from origin
    const modifiedOriginContent = originProc.stringify(modifiedOriginTree);
    origin.body = modifiedOriginContent;
    await engine.writeNote(origin, {
      updateExisting: true,
    });

    // append header to destination
    await this.appendHeaderToDestination(engine, dest!, nodesToMove);

    delayedUpdateDecorations();

    // update reference
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
