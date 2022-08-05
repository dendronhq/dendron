import {
  asyncLoopOneAtATime,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { HistoryEvent, LinkUtils } from "@dendronhq/engine-server";
import {
  ILookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3Interface";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand, SanityCheckResults } from "./base";
import * as vscode from "vscode";
import _ from "lodash";

type CommandInput = {};

type CommandOpts = {
  notes: readonly NoteProps[];
} & CommandInput;

type CommandOutput = {
  changed: NoteChangeEntry[];
} & CommandOpts;

export class MergeNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.MERGE_NOTE.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  createLookupController(): ILookupControllerV3 {
    const opts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: true,
    };
    const controller = this.extension.lookupControllerFactory.create(opts);
    return controller;
  }

  createLookupProvider() {
    return this.extension.noteLookupProviderFactory.create(this.key, {
      allowNewNote: false,
      noHidePickerOnAccept: false,
    });
  }

  async sanityCheck(
    _opts?: Partial<{ notes: readonly NoteProps[] }> | undefined
  ): Promise<SanityCheckResults> {
    const note = this.extension.wsUtils.getActiveNote();
    if (!note) {
      return "You need to have a note open to merge.";
    }
    return;
  }

  async gatherInputs(
    _opts?: CommandOpts | undefined
  ): Promise<CommandOpts | undefined> {
    const controller = this.createLookupController();
    const provider = this.createLookupProvider();
    return new Promise((resolve) => {
      NoteLookupProviderUtils.subscribe({
        id: this.key,
        controller,
        logger: this.L,
        onDone: (event: HistoryEvent) => {
          const data: NoteLookupProviderSuccessResp = event.data;
          resolve({ notes: data.selectedItems });
        },
      });
      controller.show({
        title: "Select merge destination note",
        placeholder: "note",
        provider,
      });
    });
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "MergeNoteCommand";
    this.L.info({ ctx, notes: opts.notes.map((n) => NoteUtils.toLogObj(n)) });

    if (opts.notes.length === 0) {
      vscode.window.showWarningMessage("Merge destination not selected");
      return {
        ...opts,
        changed: [],
      };
    }

    const destNote = opts.notes[0];
    const sourceNote = this.extension.wsUtils.getActiveNote();
    if (!sourceNote) {
      return {
        ...opts,
        changed: [],
      };
    }

    // grab body from current active note
    const appendPayload = sourceNote.body;

    // append to end
    const destNoteBody = destNote.body;
    const newBody = `${destNoteBody}\n\n${appendPayload}`;
    destNote.body = newBody;
    await this.extension.getEngine().writeNote(destNote);
    // update backlinks to old note

    // get all backlinks that should be updated
    const sourceNoteBacklinks = sourceNote?.links.filter((link) => {
      return link.type === "backlink";
    });

    const noteIDsToUpdate = Array.from(
      new Set(
        sourceNoteBacklinks
          .map((backlink) => backlink.from.id)
          .filter((ent): ent is string => ent !== undefined)
      )
    );

    let noteChangeEntries: NoteChangeEntry[] = [];
    await asyncLoopOneAtATime(noteIDsToUpdate, async (id) => {
      try {
        const noteToUpdate = await this.extension.getEngine().getNote(id);
        if (noteToUpdate !== undefined) {
          const linksToUpdate = noteToUpdate.links.filter(
            (link) => link.value === sourceNote.fname
          );
          const noteToUpdateDeepCopy = _.cloneDeep(noteToUpdate);
          const modifiedNote = await _.reduce<
            typeof linksToUpdate[0],
            Promise<NoteProps>
          >(
            // we need to do it backwards to not mess up the location we update
            linksToUpdate.reverse(),
            async (prev, linkToUpdate) => {
              const acc = await prev;
              const oldLink = LinkUtils.dlink2DNoteLink(linkToUpdate);
              const notesWithSameName = await this.extension
                .getEngine()
                .findNotes({
                  fname: destNote.fname,
                });
              const isXVault =
                oldLink.data.xvault || notesWithSameName.length > 1;
              const newLink = {
                ...oldLink,
                from: {
                  ...oldLink.from,
                  alias:
                    oldLink.from.alias === oldLink.from.fname
                      ? destNote.fname
                      : oldLink.from.alias,
                  fname: destNote.fname,
                  vaultName: VaultUtils.getName(destNote.vault),
                },
                data: {
                  ...oldLink.data,
                  xvault: isXVault,
                },
              };
              const newBody = LinkUtils.updateLink({
                note: acc,
                oldLink,
                newLink,
              });
              acc.body = newBody;
              return acc;
            },
            Promise.resolve(noteToUpdateDeepCopy)
          );

          noteToUpdate.body = modifiedNote.body;
          const writeResp = await this.extension
            .getEngine()
            .writeNote(noteToUpdate);
          if (writeResp.data) {
            noteChangeEntries = noteChangeEntries.concat(writeResp.data);
          }
        }
      } catch (error) {
        this.L.error({ ctx, error });
      }
    });
    // delete old note
    try {
      const deleteResp = await this.extension
        .getEngine()
        .deleteNote(sourceNote.id);
      if (deleteResp.data) {
        noteChangeEntries = noteChangeEntries.concat(deleteResp.data);
      }
    } catch (error) {
      this.L.error({ ctx, error });
    }

    // open the destination note
    await this.extension.wsUtils.openNote(destNote);
    return {
      ...opts,
      changed: noteChangeEntries,
    };
  }
}
