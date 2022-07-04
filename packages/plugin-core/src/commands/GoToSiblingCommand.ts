import {
  DendronError,
  DEngineClient,
  DNodeUtils,
  isNumeric,
  NoteProps,
  NotePropsByIdDict,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { ExtensionProvider } from "../ExtensionProvider";
import { UNKNOWN_ERROR_MSG } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = { direction: "next" | "prev" };
export { CommandOpts as GoToSiblingCommandOpts };

type CommandOutput = { msg: "ok" | "no_editor" | "no_siblings" };

export class GoToSiblingCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = "dendron.goToSibling";

  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute(opts: CommandOpts) {
    console.log("go to sibling command is being executed");
    const ctx = "GoToSiblingCommand";
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (!maybeTextEditor) {
      window.showErrorMessage("You need to be in a note to use this command");
      return {
        msg: "no_editor" as const,
      };
    }
    let value = "";
    value = path.basename(maybeTextEditor.document.uri.fsPath, ".md");
    let siblingNotes: NoteProps[] = [];

    const { vaults, engine, wsRoot } = ExtensionProvider.getDWorkspace();
    if (value === "root") {
      const vault = VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
        fsPath: maybeTextEditor.document.uri.fsPath,
      });
      const rootNode = NoteUtils.getNoteByFnameFromEngine({
        fname: value,
        vault,
        engine,
      });
      if (_.isUndefined(rootNode)) {
        throw new DendronError({ message: "no root node found" });
      }
      siblingNotes = rootNode.children
        .map((ent) => engine.notes[ent])
        .concat([rootNode]);
    } else {
      const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
      const note = NoteUtils.getNoteByFnameFromEngine({
        fname: value,
        vault,
        engine,
      });
      if (!_.isUndefined(note)) {
        siblingNotes = getSiblings(engine.notes, note.parent!);
      }
    }

    if (siblingNotes.length <= 1) {
      window.showInformationMessage(
        "One is the loneliest number. This node has no siblings :( "
      );
      return {
        msg: "no_siblings" as const,
      };
    }

    // check if there are numeric-only nodes
    const numericNodes = _.filter(siblingNotes, (o) => {
      const leafName = DNodeUtils.getLeafName(o);
      return isNumeric(leafName);
    });

    // determine how much we want to zero-pad the numeric-only node names
    let padLength = 0;
    if (numericNodes.length > 0) {
      const sortedNumericNodes = _.orderBy(
        numericNodes,
        (o) => {
          return DNodeUtils.getLeafName(o)!.length;
        },
        "desc"
      );
      padLength = sortedNumericNodes[0].fname.length;
    }

    // zero-pad numeric-only nodes before sorting
    const sorted = _.sortBy(siblingNotes, (o) => {
      const leafName = DNodeUtils.getLeafName(o);
      if (isNumeric(leafName)) {
        return _.padStart(leafName, padLength, "0");
      }
      return leafName;
    });
    const indexOfCurrentNote = _.findIndex(sorted, { fname: value });
    if (indexOfCurrentNote < 0) {
      throw new Error(`${ctx}: ${UNKNOWN_ERROR_MSG}`);
    }
    let siblingNote: null | NoteProps = null;
    if (opts.direction === "next") {
      const isJournalNote = NoteUtils.getNoteTraits(
        siblingNotes[indexOfCurrentNote]
      ).includes("journalNote");
      if (isJournalNote) {
        console.log("the note is handled as a journal note...");
        siblingNote = await journalMonthCheck(
          engine,
          siblingNotes,
          indexOfCurrentNote
        );
        console.log("siblingNote after journalMonthCheck", siblingNote);
      }

      if (!siblingNote) {
        siblingNote =
          indexOfCurrentNote === siblingNotes.length - 1
            ? sorted[0]
            : sorted[indexOfCurrentNote + 1];
      }
    } else {
      //TODO: Should I also move a month back?
      siblingNote =
        indexOfCurrentNote === 0
          ? sorted.slice(-1)[0]
          : sorted[indexOfCurrentNote - 1];
    }
    const vpath = vault2Path({
      vault: siblingNote.vault,
      wsRoot: getDWorkspace().wsRoot,
    });
    await VSCodeUtils.openFileInEditor(
      VSCodeUtils.joinPath(Uri.file(vpath), siblingNote.fname + ".md")
    );
    return { msg: "ok" as const };
  }
}

// This is a trial func for moving back and forward throug journal notes
// not just for months
// const handleJournalNotes = async (
//   journalNote: NoteProps
// ): Promise<NoteProps | null> => {
//   return null;
// };

const journalMonthCheck = async (
  engine: DEngineClient,
  sortedNotes: NoteProps[],
  idx: number
): Promise<NoteProps | null> => {
  const currentNote = sortedNotes[idx];

  //TODO: This is not necessarily the end of the month
  const isEndOfMonth = idx === sortedNotes.length - 1;
  if (!isEndOfMonth) return null;

  // Get the journal note for the first day of the next month if exists
  return getFirstDayOfNextMonth(engine, currentNote);
};

// How to get siblings of upper level
const getSiblings = (
  notes: NotePropsByIdDict,
  parentNoteId: string
): NoteProps[] => {
  return notes[parentNoteId].children
    .map((id) => notes[id])
    .filter((ent) => _.isUndefined(ent.stub));
};

const getFirstDayOfNextMonth = async (
  engine: DEngineClient,
  currentDayNote: NoteProps
): Promise<NoteProps | null> => {
  // Get the next month. This current month is December, return null
  const month = getMonth(currentDayNote.fname);
  if (month >= 12) return null;
  const nextMonth = month + 1;

  // Get the fname of the journal note for the first day of the next month
  const portions = currentDayNote.fname.split(".");
  portions.splice(-2, 2, convertMonthToStringn(nextMonth), "01");
  const fname = portions.join(".");

  // Return the NoteProps for the journal note for the first day of the next month.
  // If there is no such a note, return null
  const hitNotes = await engine.findNotes({
    fname,
    vault: currentDayNote.vault,
  });
  return hitNotes.length < 0 ? hitNotes[0] : null;
};

// Pad zero to make the string two-char length
const convertMonthToStringn = (month: number) => {
  return (month < 10 ? "0" : "") + month.toString();
};

// Get the current month given the fname of a journal note
const getMonth = (fname: string) => parseInt(fname.split(".").slice(-2)[0], 10);
