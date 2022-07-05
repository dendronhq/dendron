import {
  DNodeUtils,
  DWorkspaceV2,
  isNumeric,
  NoteProps,
  NotePropsByIdDict,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { TextEditor, Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { ExtensionProvider } from "../ExtensionProvider";
import { UNKNOWN_ERROR_MSG } from "../logger";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type Direction = "next" | "prev";
type CommandOpts = { direction: Direction };
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
    // Context for error messages
    const ctx = "GoToSiblingCommand";
    // Get text editor
    const textEditor = VSCodeUtils.getActiveTextEditor();
    if (!textEditor) {
      window.showErrorMessage("You need to be in a note to use this command");
      return {
        msg: "no_editor" as const,
      };
    }
    // Get fname of the active note
    const fname = path.basename(textEditor.document.uri.fsPath, ".md");
    // Get workspace
    const workspace = ExtensionProvider.getDWorkspace();
    // Get the active note
    const note = await getActiveNote(workspace, textEditor, fname);
    if (!note) throw new Error(`${ctx}: ${UNKNOWN_ERROR_MSG}`);
    // Get the sibling note
    let siblingNote: NoteProps;
    // If the active note is a journal note, get the sibling note based on the chronological order
    if (isJournalNote(note)) {
      const allNotes: NoteProps[] = Object.values(workspace.engine.notes);
      const { sibling, msg } = await getSiblingForJournalNote(
        allNotes,
        note,
        opts.direction
      );
      if (msg) return { msg };
      siblingNote = sibling!;
    } else {
      const { sibling, msg } = getSibling(workspace, note, opts.direction, ctx);
      if (msg) return { msg };
      siblingNote = sibling!;
    }
    // Get path to the vault
    const vpath = vault2Path({
      vault: siblingNote.vault,
      wsRoot: workspace.wsRoot,
    });
    // Open the sibling note
    await VSCodeUtils.openFileInEditor(
      VSCodeUtils.joinPath(Uri.file(vpath), siblingNote.fname + ".md")
    );
    // Return the success message for testing
    return { msg: "ok" as const };
  }
}

const getActiveNote = async (
  { engine, vaults, wsRoot }: DWorkspaceV2,
  textEditor: TextEditor,
  fname: string
): Promise<NoteProps | null> => {
  const vault =
    fname === "root"
      ? VaultUtils.getVaultByFilePath({
          vaults,
          wsRoot,
          fsPath: textEditor.document.uri.fsPath,
        })
      : PickerUtilsV2.getOrPromptVaultForOpenEditor();
  const hitNotes = await engine.findNotes({ fname, vault });
  return hitNotes.length !== 0 ? hitNotes[0] : null;
};

const isJournalNote = (note: NoteProps): boolean => {
  return NoteUtils.getNoteTraits(note).includes("journalNote");
};

const getSiblingForJournalNote = async (
  allNotes: NoteProps[],
  currNote: NoteProps,
  direction: Direction
): Promise<{ sibling: NoteProps | null; msg: CommandOutput["msg"] | null }> => {
  const journalNotes = allNotes.filter((note) =>
    NoteUtils.getNoteTraits(note).includes("journalNote")
  );
  // If the active note is the only journal note in the workspace, there is no sibling
  if (journalNotes.length === 1) {
    VSCodeUtils.showMessage(
      MessageSeverity.WARN,
      "There is no sibling journal note. Currently open note is the only journal note in the current workspace",
      {}
    );
    return { sibling: null, msg: "no_siblings" };
  }
  // Sort all journal notes in the workspace
  const sortedJournalNotes = _.sortBy(journalNotes, [
    (note) => getDateFromJournalNote(note).valueOf(),
  ]);
  const currNoteIdx = _.findIndex(sortedJournalNotes, { id: currNote.id });
  // Get the sibling based on the direction
  let sibling: NoteProps;
  if (direction === "next") {
    sibling =
      currNoteIdx !== sortedJournalNotes.length - 1
        ? sortedJournalNotes[currNoteIdx + 1]
        : sortedJournalNotes[0];
  } else {
    sibling =
      currNoteIdx !== 0
        ? sortedJournalNotes[currNoteIdx - 1]
        : _.last(sortedJournalNotes)!;
  }
  return { sibling, msg: null };
};

const getSibling = (
  workspace: DWorkspaceV2,
  note: NoteProps,
  direction: Direction,
  ctx: string
): { sibling: NoteProps | null; msg: CommandOutput["msg"] | null } => {
  // Get sibling notes
  const siblingNotes = getSiblings(workspace.engine.notes, note.parent!);
  // Check if there is any sibling notes
  if (siblingNotes.length <= 1) {
    VSCodeUtils.showMessage(
      MessageSeverity.INFO,
      "There is no sibling note in this workspace",
      {}
    );
    return { sibling: null, msg: "no_siblings" };
  }
  // Sort the sibling notes
  const sortedSiblingNotes = sortNotes(siblingNotes);
  // Get the index of the active note in the sorted notes
  const idx = _.findIndex(sortedSiblingNotes, { fname: note.fname });
  // Deal with the unexpected error
  if (idx < 0) {
    throw new Error(`${ctx}: ${UNKNOWN_ERROR_MSG}`);
  }
  // Get sibling based on the direction
  let sibling: NoteProps;
  if (direction === "next") {
    sibling =
      idx !== siblingNotes.length - 1
        ? sortedSiblingNotes[idx + 1]
        : sortedSiblingNotes[0];
  } else {
    sibling =
      idx !== 0 ? sortedSiblingNotes[idx - 1] : _.last(sortedSiblingNotes)!;
  }
  return { sibling, msg: null };
};

const getSiblings = (
  notes: NotePropsByIdDict,
  parentNoteId: string
): NoteProps[] => {
  return notes[parentNoteId].children
    .map((id) => notes[id])
    .filter((ent) => _.isUndefined(ent.stub));
};

const sortNotes = (notes: NoteProps[]) => {
  // check if there are numeric-only nodes
  const numericNodes = _.filter(notes, (o) => {
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
  return _.sortBy(notes, (o) => {
    const leafName = DNodeUtils.getLeafName(o);
    if (isNumeric(leafName)) {
      return _.padStart(leafName, padLength, "0");
    }
    return leafName;
  });
};

const getDateFromJournalNote = (note: NoteProps): Date => {
  const [year, month, date] = note.fname
    .split("")
    .slice(-3)
    .map((str) => parseInt(str, 10));
  return new Date(year, month - 1, date);
};

/* Code for navigating journal notes across months */
// const journalMonthCheck = async (
//   engine: DEngineClient,
//   sortedNotes: NoteProps[],
//   idx: number
// ): Promise<NoteProps | null> => {
//   const currentNote = sortedNotes[idx];

//   //TODO: This is not necessarily the end of the month
//   const isEndOfMonth = idx === sortedNotes.length - 1;
//   if (!isEndOfMonth) return null;

//   // Get the journal note for the first day of the next month if exists
//   return getFirstDayOfNextMonth(engine, currentNote);
// };

// const getFirstDayOfNextMonth = async (
//   engine: DEngineClient,
//   currentDayNote: NoteProps
// ): Promise<NoteProps | null> => {
//   // Get the next month. This current month is December, return null
//   const month = getMonth(currentDayNote.fname);
//   if (month >= 12) return null;
//   const nextMonth = month + 1;

//   // Get the fname of the journal note for the first day of the next month
//   const portions = currentDayNote.fname.split(".");
//   portions.splice(-2, 2, convertMonthToStringn(nextMonth), "01");
//   const fname = portions.join(".");

//   // Return the NoteProps for the journal note for the first day of the next month.
//   // If there is no such a note, return null
//   const hitNotes = await engine.findNotes({
//     fname,
//     vault: currentDayNote.vault,
//   });
//   return hitNotes.length < 0 ? hitNotes[0] : null;
// };
// // Pad zero to make the string two-char length
// const convertMonthToStringn = (month: number) => {
//   return (month < 10 ? "0" : "") + month.toString();
// };
// // Get the current month given the fname of a journal note
// const getMonth = (fname: string) => parseInt(fname.split(".").slice(-2)[0], 10);
