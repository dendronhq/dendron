import {
  ConfigUtils,
  DendronError,
  NoteProps,
  TaskNoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { VSCodeUtils, MessageSeverity } from "../vsCodeUtils";
import { IDendronExtension } from "../dendronExtensionInterface";
import { QuickPickItem } from "vscode";
import { EditorUtils } from "../utils/EditorUtils";
import { delayedUpdateDecorations } from "../features/windowDecorations";

type CommandInput = {
  setStatus?: string;
};

type CommandOpts = Required<CommandInput> & {
  note: NoteProps;
};

type CommandOutput = {};

export class TaskStatusCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.TASK_SET_STATUS.key;
  public static requireActiveWorkspace: boolean = true;
  private _ext: IDendronExtension;

  constructor(extension: IDendronExtension) {
    super();
    this._ext = extension;
  }

  async gatherInputs(opts?: CommandInput): Promise<CommandOpts | undefined> {
    const selection = await EditorUtils.getLinkFromSelectionWithWorkspace();
    let selectedNote: NoteProps | undefined;

    if (!selection) {
      // Then they are changing the status for the current note
      selectedNote = await this._ext.wsUtils.getActiveNote();
      if (!selectedNote || !TaskNoteUtils.isTaskNote(selectedNote)) {
        // No active note either
        VSCodeUtils.showMessage(
          MessageSeverity.WARN,
          "Please open a task note, or select a link to a task note before using this command.",
          {}
        );
        return;
      }
    } else {
      const engine = this._ext.getDWorkspace().engine;
      const vault = selection.vaultName
        ? VaultUtils.getVaultByName({
            vaults: await this._ext.getDWorkspace().vaults,
            vname: selection.vaultName,
          })
        : undefined;

      if (!selectedNote) {
        const notes = await engine.findNotes({ fname: selection.value, vault });
        if (notes.length === 0) {
          VSCodeUtils.showMessage(
            MessageSeverity.WARN,
            `Linked note ${selection.value} is not found, make sure the note exists first.`,
            {}
          );
          return;
        } else if (notes.length > 1) {
          const picked = await VSCodeUtils.showQuickPick(
            notes.map((note): QuickPickItem => {
              return {
                label: note.title,
                description: VaultUtils.getName(note.vault),
                detail: note.vault.fsPath,
              };
            }),
            {
              canPickMany: false,
              ignoreFocusOut: true,
              matchOnDescription: true,
              title: "Multiple notes match selected link, please pick one",
            }
          );
          if (!picked) {
            // Cancelled prompt
            return;
          }
          const pickedNote = notes.find(
            (note) => note.vault.fsPath === picked.detail
          );
          if (!pickedNote) {
            throw new DendronError({
              message: "Can't find selected note",
              payload: {
                notes,
                picked,
              },
            });
          }
          selectedNote = pickedNote;
        } else {
          selectedNote = notes[0];
        }
      }
    }

    let setStatus = opts?.setStatus;
    if (!setStatus) {
      // If no status has been provided already (e.g. a custom shortcut),
      // then prompt for the status
      const currentStatus = selectedNote.custom?.status;
      const knownStatuses = Object.entries(
        ConfigUtils.getTask(await this._ext.getDWorkspace().config)
          .statusSymbols
      ).filter(
        ([key, value]) =>
          // Don't suggest the current status as an option
          key !== currentStatus && value !== currentStatus
      );

      const pickedStatus = await VSCodeUtils.showQuickPick(
        knownStatuses.map(([key, value]): QuickPickItem => {
          return {
            label: key,
            description: value,
          };
        }),
        {
          canPickMany: false,
          ignoreFocusOut: true,
          matchOnDescription: true,
          title: `Pick the new status for "${selectedNote.title}"`,
        }
      );
      if (!pickedStatus) {
        // Prompt cancelled, do not change task status
        return;
      }
      setStatus = pickedStatus.label;
    }

    return {
      note: selectedNote,
      setStatus,
    };
  }

  async execute(opts: CommandOpts) {
    opts.note.custom = {
      ...opts.note.custom,
      status: opts.setStatus,
    };

    await this._ext.getEngine().writeNote(opts.note);

    delayedUpdateDecorations();

    return {};
  }
}
