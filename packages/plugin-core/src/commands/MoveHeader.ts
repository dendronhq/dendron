import {
  DendronError,
  NoteProps,
  NoteUtils,
  VaultUtils,
  getSlugger,
} from "@dendronhq/common-all";
import {
  HistoryService,
  DendronASTDest,
  DendronASTTypes,
  AnchorUtils,
  Processor,
  RemarkUtils,
  MDUtilsV5,
  ProcMode,
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
import { findReferences } from "../utils/md";

type CommandInput = {} | undefined;
type CommandOpts = {
  dest: NoteProps;
  origin: NoteProps;
  nodesToMove: Node[];
  modifiedOriginTree: Node;
  originProc: Processor;
  engine: EngineAPIService;
} & CommandInput;
type CommandOutput = CommandOpts;

export class MoveHeaderCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.MOVE_HEADER.key;

  headerNotSelectedError = new DendronError({
    message: "You must first select the header you want to move.",
  });

  noActiveNoteError = new DendronError({
    message: "No note open.",
  });

  getProc = (engine: EngineAPIService, note: NoteProps) => {
    return MDUtilsV5.procRemarkParse(
      { mode: ProcMode.FULL },
      {
        engine,
        fname: note.fname,
        vault: note.vault,
        dest: DendronASTDest.MD_DENDRON,
      }
    );
  };

  /**
   * Recursively check if two given node is identical.
   * At each level _position_ is omitted as this can change if
   * you are comparing from two different trees.
   * @param a first {@link Node} to compare
   * @param b second {@link Node} to compare
   * @returns boolean
   */
  hasIdenticalChildren = (a: Node, b: Node): boolean => {
    if (_.isEqual(Object.keys(a).sort(), Object.keys(b).sort())) {
      const aOmit = _.omit(a, ["position", "children"]);
      const bOmit = _.omit(b, ["position", "children"]);
      if (_.isEqual(aOmit, bOmit)) {
        if (_.has(a, "children")) {
          return _.every(a.children as Node[], (aChild, aIndex) => {
            const bChild = (b.children as Node[])[aIndex];
            return this.hasIdenticalChildren(aChild, bChild);
          });
        }
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  async gatherInputs(_opts: CommandInput): Promise<CommandOpts | undefined> {
    const engine = getEngine();
    const { editor, selection } = VSCodeUtils.getSelection();
    if (!editor || !selection) throw this.headerNotSelectedError;

    // const text = editor.document.getText();
    const line = editor.document.lineAt(selection.start.line).text;
    const maybeNote = VSCodeUtils.getNoteFromDocument(editor.document);
    if (!maybeNote) {
      throw this.noActiveNoteError;
    }

    const proc = this.getProc(engine, maybeNote);
    const parsedLine = proc.parse(line);
    let targetHeader: Heading | undefined;
    visit(parsedLine, [DendronASTTypes.HEADING], (heading: Heading) => {
      targetHeader = heading;
      return false;
    });
    if (!targetHeader) {
      throw this.headerNotSelectedError;
    }
    const tree = proc.parse(maybeNote.body);
    let headerFound = false;
    let foundHeaderIndex: number | undefined;
    let nextHeaderIndex: number | undefined;
    visit(tree, (node, index) => {
      if (nextHeaderIndex) {
        return;
      }
      const depth = node.depth as Heading["depth"];
      if (!headerFound) {
        if (node.type === DendronASTTypes.HEADING) {
          if (
            depth === targetHeader!.depth &&
            this.hasIdenticalChildren(node, targetHeader!)
          ) {
            headerFound = true;
            foundHeaderIndex = index;
            return;
          }
        }
      } else if (node.type === DendronASTTypes.HEADING) {
        if (foundHeaderIndex) {
          if (depth <= targetHeader!.depth) nextHeaderIndex = index;
        }
      }
    });

    const nodesToMove = nextHeaderIndex
      ? (tree.children as any[]).splice(
          foundHeaderIndex!,
          nextHeaderIndex! - foundHeaderIndex!
        )
      : (tree.children as any[]).splice(foundHeaderIndex!);

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
    });

    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id: this.key,
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove(this.key, "lookupProvider");
            const cdata = event.data as NoteLookupProviderSuccessResp;
            resolve({
              dest: cdata.selectedItems[0],
              origin: maybeNote,
              nodesToMove,
              modifiedOriginTree: tree,
              originProc: proc,
              engine,
            });
            lookupController.onHide();
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

  removePosition = (nodes: Node[]) => {
    return _.map(nodes, (node) => {
      visit(node, (n) => {
        delete n["position"];
      });
      return node;
    });
  };

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
    const destProc = this.getProc(engine, dest);
    const destTree = destProc.parse(dest.body);
    destTree.children = (destTree.children as Node[]).concat(nodesToMove);
    const modifiedDestContent = destProc.stringify(destTree);
    dest.body = modifiedDestContent;
    await engine.writeNote(dest, {
      updateExisting: true,
    });

    delayedUpdateDecorations();

    // update reference
    const anchorsBefore = RemarkUtils.findAnchors(originDeepCopy.body);
    const anchorsAfter = RemarkUtils.findAnchors(modifiedOriginContent);
    const anchorsToUpdate = _.differenceWith(
      anchorsBefore,
      anchorsAfter,
      this.hasIdenticalChildren
    );
    const anchorsToUpdateNames = _.map(anchorsToUpdate, (anchor) => {
      const slugger = getSlugger();
      const payload = AnchorUtils.anchorNode2anchor(anchor, slugger);
      return payload![0];
    });

    const foundReferences = await findReferences(origin.fname);
    const { vaults, wsRoot, notes } = engine;
    _.forEach(foundReferences, async (reference) => {
      const { location, isCandidate } = reference;
      // ignore candidate refs.
      if (isCandidate) return false;
      // get note from location
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
      if (!note) return false;

      // find match text in note and modify the node
      const proc = this.getProc(engine, note);
      const tree = proc.parse(note.body);
      visit(tree, (node: Node) => {
        if (node.type === DendronASTTypes.WIKI_LINK) {
          if (
            node.value === origin.fname &&
            _.includes(anchorsToUpdateNames, node.data!.anchorHeader)
          ) {
            node.value = dest.fname;
          }
        }
      });
      note.body = proc.stringify(tree);
      await engine.writeNote(note, { updateExisting: true });
      return;
    });
    return opts;
  }
}
