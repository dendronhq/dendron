import {
  DEngineClient,
  DNodeUtils,
  DWorkspaceV2,
  isNumeric,
  NotePropsMeta,
  NoteUtils,
  ReducedDEngine,
  RespV3,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { ExtensionProvider } from "../ExtensionProvider";
import { UNKNOWN_ERROR_MSG } from "../logger";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { BasicCommand } from "./base";

type Direction = "next" | "prev";
type CommandOpts = { direction: Direction };
export { CommandOpts as GoToSiblingCommandOpts };

type CommandOutput = {
  msg: "ok" | "no_editor" | "no_siblings" | "other_error";
};

export class GoToSiblingCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = "dendron.goToSibling";

  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute(opts: CommandOpts) {
    const ctx = "GoToSiblingCommand";
    // check if editor exists
    const textEditor = VSCodeUtils.getActiveTextEditor();
    if (!textEditor) {
      window.showErrorMessage("You need to be in a note to use this command");
      return {
        msg: "no_editor" as const,
      };
    }

    const fname = path.basename(textEditor.document.uri.fsPath, ".md");
    const ext = ExtensionProvider.getExtension();
    const workspace = ext.getDWorkspace();
    const note = await this.getActiveNote(workspace.engine, fname);

    // check if a Dendron note is active
    if (!note) {
      window.showErrorMessage("Please open a Dendron note to use this command");
      return {
        msg: "other_error" as const,
      };
    }

    let siblingNote: NotePropsMeta;
    // If the active note is a journal note, get the sibling note based on the chronological order
    if (await this.canBeHandledAsJournalNote(note, workspace.wsRoot)) {
      const resp = await this.getSiblingForJournalNote(
        workspace.engine,
        note,
        opts.direction
      );
      if (resp.error) {
        VSCodeUtils.showMessage(MessageSeverity.WARN, resp.error.message, {});
        return { msg: "other_error" } as CommandOutput;
      }
      siblingNote = resp.data.sibling;
    } else {
      const resp = await this.getSibling(workspace, note, opts.direction, ctx);
      if (resp.error) {
        VSCodeUtils.showMessage(MessageSeverity.WARN, resp.error.message, {});
        return { msg: "other_error" } as CommandOutput;
      }
      siblingNote = resp.data.sibling;
    }

    await new WSUtilsV2(ext).openNote(siblingNote);
    return { msg: "ok" as const };
  }

  async getActiveNote(
    engine: DEngineClient,
    fname: string
  ): Promise<NotePropsMeta | null> {
    const vault = PickerUtilsV2.getVaultForOpenEditor();
    const hitNotes = await engine.findNotesMeta({ fname, vault });
    return hitNotes.length !== 0 ? hitNotes[0] : null;
  }

  private async canBeHandledAsJournalNote(
    note: NotePropsMeta,
    wsRoot: string
  ): Promise<boolean> {
    const markedAsJournalNote =
      NoteUtils.getNoteTraits(note).includes("journalNote");
    if (!markedAsJournalNote) return false;

    // Check the date format for journal note. Only when date format of journal notes is default,
    // navigate chronologically
    const config = DConfig.readConfigSync(wsRoot);
    const dateFormat = config.workspace.journal.dateFormat;
    return dateFormat === "y.MM.dd";
  }

  private async getSiblingForJournalNote(
    engine: ReducedDEngine,
    currNote: NotePropsMeta,
    direction: Direction
  ): Promise<RespV3<{ sibling: NotePropsMeta }>> {
    const journalNotes = await this.getSiblingsForJournalNote(engine, currNote);
    // If the active note is the only journal note in the workspace, there is no sibling
    if (journalNotes.length === 1) {
      return {
        error: {
          name: "no_siblings",
          message:
            "There is no sibling journal note. Currently open note is the only journal note in the current workspace",
        },
      };
    }
    // Sort all journal notes in the workspace
    const sortedJournalNotes = _.sortBy(journalNotes, [
      (note) => this.getDateFromJournalNote(note).valueOf(),
    ]);
    const currNoteIdx = _.findIndex(sortedJournalNotes, { id: currNote.id });
    // Get the sibling based on the direction.
    let sibling: NotePropsMeta;
    if (direction === "next") {
      sibling =
        currNoteIdx !== sortedJournalNotes.length - 1
          ? sortedJournalNotes[currNoteIdx + 1]
          : // If current note is the latest journal note, get the earliest note as the sibling
            sortedJournalNotes[0];
    } else {
      sibling =
        currNoteIdx !== 0
          ? sortedJournalNotes[currNoteIdx - 1]
          : // If current note is the earliest journal note, get the last note as the sibling
            _.last(sortedJournalNotes)!;
    }
    return { data: { sibling } };
  }

  private getSiblingsForJournalNote = async (
    engine: ReducedDEngine,
    currNote: NotePropsMeta
  ): Promise<NotePropsMeta[]> => {
    if (!currNote.parent) {
      return [];
    }
    const monthNote = await engine.getNoteMeta(currNote.parent);
    if (!monthNote.data) {
      return [];
    }
    if (!monthNote.data.parent) {
      return [];
    }
    const yearNote = await engine.getNoteMeta(monthNote.data.parent);
    if (!yearNote.data) {
      return [];
    }
    if (!yearNote.data.parent) {
      return [];
    }
    const parentNote = await engine.getNoteMeta(yearNote.data.parent!);
    if (!parentNote.data) {
      return [];
    }

    const siblings = await Promise.all(
      parentNote.data.children.flatMap(async (yearNoteId) => {
        const yearNote = await engine.getNoteMeta(yearNoteId);
        if (yearNote.data) {
          const children = await engine.bulkGetNotesMeta(
            yearNote.data.children
          );
          const results = await Promise.all(
            children.data.flatMap(async (monthNote) => {
              const monthChildren = await engine.bulkGetNotesMeta(
                monthNote.children
              );

              return monthChildren.data;
            })
          );
          return results.flat();
        } else {
          return [];
        }
      })
    );
    // Filter out stub notes
    return siblings.flat().filter((note) => !note.stub);
  };

  private async getSibling(
    workspace: DWorkspaceV2,
    note: NotePropsMeta,
    direction: Direction,
    ctx: string
  ): Promise<RespV3<{ sibling: NotePropsMeta }>> {
    // Get sibling notes
    const siblingNotes = await this.getSiblings(workspace.engine, note);
    // Check if there is any sibling notes
    if (siblingNotes.length <= 1) {
      return {
        error: {
          name: "no_siblings",
          message: "One is the loneliest number. This node has no siblings :(",
        },
      };
    }
    // Sort the sibling notes
    const sortedSiblingNotes = this.sortNotes(siblingNotes);
    // Get the index of the active note in the sorted notes
    const idx = _.findIndex(sortedSiblingNotes, { id: note.id });
    // Deal with the unexpected error
    if (idx < 0) {
      throw new Error(`${ctx}: ${UNKNOWN_ERROR_MSG}`);
    }
    // Get sibling based on the direction
    let sibling: NotePropsMeta;
    if (direction === "next") {
      sibling =
        idx !== siblingNotes.length - 1
          ? sortedSiblingNotes[idx + 1]
          : sortedSiblingNotes[0];
    } else {
      sibling =
        idx !== 0 ? sortedSiblingNotes[idx - 1] : _.last(sortedSiblingNotes)!;
    }
    return { data: { sibling } };
  }

  private async getSiblings(
    engine: ReducedDEngine,
    currNote: NotePropsMeta
  ): Promise<NotePropsMeta[]> {
    if (currNote.parent === null) {
      const children = await engine.bulkGetNotesMeta(currNote.children);
      return children.data.filter((note) => !note.stub).concat(currNote);
    } else {
      const parent = await engine.getNoteMeta(currNote.parent);
      if (parent.data) {
        const children = await engine.bulkGetNotesMeta(parent.data.children);
        return children.data.filter((note) => !note.stub);
      } else {
        return [];
      }
    }
  }

  private sortNotes(notes: NotePropsMeta[]) {
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
  }

  private getDateFromJournalNote(note: NotePropsMeta): Date {
    const [year, month, date] = note.fname
      .split("")
      .slice(-3)
      .map((str) => parseInt(str, 10));
    return new Date(year, month - 1, date);
  }
}
