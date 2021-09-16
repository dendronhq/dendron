import { DendronError, NoteProps } from "@dendronhq/common-all";
import {
  HistoryService,
  DendronASTDest,
  DendronASTTypes,
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
import { getEngine } from "../workspace";

type CommandInput = {} | undefined;
type CommandOpts = {
  notes: readonly NoteProps[];
  nodesToMove: Node[];
  tree: Node;
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

  async gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined> {
    console.log({ opts });
    const { editor, selection } = VSCodeUtils.getSelection();
    if (!editor || !selection) throw this.headerNotSelectedError;

    const text = editor.document.getText();
    const line = editor.document.lineAt(selection.start.line).text;
    const maybeNote = VSCodeUtils.getNoteFromDocument(editor.document);
    if (!maybeNote) {
      throw this.noActiveNoteError;
    }

    const proc = MDUtilsV5.procRemarkParse(
      { mode: ProcMode.FULL },
      {
        engine: getEngine(),
        fname: maybeNote?.fname,
        vault: maybeNote.vault,
        dest: DendronASTDest.MD_DENDRON,
      }
    );
    const parsedLine = proc.parse(line);
    let targetHeader: Heading | undefined;
    visit(parsedLine, [DendronASTTypes.HEADING], (heading: Heading) => {
      targetHeader = heading;
      return false;
    });
    if (!targetHeader) {
      throw this.headerNotSelectedError;
    }
    console.log({ targetHeader });
    const tree = proc.parse(text);
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
    console.log({ nodesToMove });
    console.log(proc.stringify(tree));

    const lookupController = LookupControllerV3.create({
      nodeType: "note",
      disableVaultSelection: false,
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
            console.log({
              ctx: "lookup done.",
              notes: cdata.selectedItems,
              nodesToMove,
              tree,
            });
            resolve({ notes: cdata.selectedItems, nodesToMove, tree });
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

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "MoveHeaderCommand";
    this.L.info({ ctx, opts });
    // show what is going to be changed

    // remove header from origin

    // append header to destination

    // update all references to the header
    return opts;
  }
}
