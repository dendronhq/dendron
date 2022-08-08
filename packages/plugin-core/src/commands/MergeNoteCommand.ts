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

  private createLookupController(): ILookupControllerV3 {
    const opts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: true,
    };
    const controller = this.extension.lookupControllerFactory.create(opts);
    return controller;
  }

  private createLookupProvider(opts: { activeNote: NoteProps | undefined }) {
    const { activeNote } = opts;
    return this.extension.noteLookupProviderFactory.create(this.key, {
      allowNewNote: false,
      noHidePickerOnAccept: false,
      preAcceptValidators: [
        // disallow accepting the currently active note from the picker.
        (selectedItems) => {
          const maybeActiveNoteItem = selectedItems.find((item) => {
            return item.id === activeNote?.id;
          });
          if (maybeActiveNoteItem) {
            vscode.window.showErrorMessage(
              "You cannot merge a note to itself."
            );
          }
          return !maybeActiveNoteItem;
        },
      ],
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
    const activeNote = this.extension.wsUtils.getActiveNote();
    const provider = this.createLookupProvider({
      activeNote,
    });
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

  /**
   * Given a source note and destination note,
   * append the entire body of source note to the destination note.
   * @param source Source note
   * @param dest Dest note
   */
  private async appendNote(opts: { source: NoteProps; dest: NoteProps }) {
    const { source, dest } = opts;
    // grab body from current active note
    const appendPayload = source.body;

    // append to end
    const destBody = dest.body;
    const newBody = `${destBody}\n\n${appendPayload}`;
    dest.body = newBody;
    const writeResp = await this.extension.getEngine().writeNote(dest);
    if (!writeResp.error) {
      return writeResp.data || [];
    } else {
      this.L.error(writeResp.error);
      return [];
    }
  }

  /**
   * Helper for {@link updateBacklinks}.
   * Given a note id, source and dest note,
   * Find all links in note with id that points to source
   * and update it to point to dest instead.
   * @param opts
   */
  private async updateLinkInNote(opts: {
    id: string;
    source: NoteProps;
    dest: NoteProps;
  }) {
    const ctx = `${this.key}:updateLinkInNote`;
    const { id, source, dest } = opts;
    const noteToUpdate = await this.extension.getEngine().getNote(id);
    if (noteToUpdate !== undefined) {
      const linksToUpdate = noteToUpdate.links.filter(
        (link) => link.value === source.fname
      );
      const noteToUpdateDeepCopy = _.cloneDeep(noteToUpdate);
      const modifiedNote = await _.reduce<
        typeof linksToUpdate[0],
        Promise<NoteProps>
      >(
        // we need to do it in reverse order to not mess up the location we update
        linksToUpdate.reverse(),
        async (prev, linkToUpdate) => {
          const acc = await prev;
          const oldLink = LinkUtils.dlink2DNoteLink(linkToUpdate);
          const notesWithSameName = await this.extension.getEngine().findNotes({
            fname: dest.fname,
          });
          const isXVault = oldLink.data.xvault || notesWithSameName.length > 1;
          const newLink = {
            ...oldLink,
            from: {
              ...oldLink.from,
              alias:
                oldLink.from.alias === oldLink.from.fname
                  ? dest.fname
                  : oldLink.from.alias,
              fname: dest.fname,
              vaultName: VaultUtils.getName(dest.vault),
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
        return writeResp.data;
      } else {
        // We specifically filtered for notes that do have some links to update,
        // so this is very unlikely to be reached.
        // Gracefully handle and log error
        this.L.error({ ctx, message: "No links found to update" });
        return [];
      }
    }
    // Note to update wasn't found
    // this will likely never happen given a sound engine state.
    // Log this as a canary for the engine state, and gracefully return.
    this.L.error({ ctx, message: "No note found" });
    return [];
  }

  /**
   * Given a source note and dest note,
   * Look at all the backlinks source note has, and update them
   * to point to the dest note.
   * @param source Source note
   * @param dest Dest note
   */
  private async updateBacklinks(opts: { source: NoteProps; dest: NoteProps }) {
    const ctx = "MergeNoteCommand:updateBacklinks";
    const { source, dest } = opts;

    // grab all backlinks from source note
    const sourceBacklinks = source.links.filter((link) => {
      return link.type === "backlink";
    });

    // scrub through the backlinks and all notes that need to be updated
    const noteIDsToUpdate = Array.from(
      new Set(
        sourceBacklinks
          .map((backlink) => backlink.from.id)
          .filter((ent): ent is string => ent !== undefined)
      )
    );

    // for each note that needs to be updated,
    // find all links that need to be updated from end to front.
    // then update them.
    let noteChangeEntries: NoteChangeEntry[] = [];
    await asyncLoopOneAtATime(noteIDsToUpdate, async (id) => {
      try {
        const changed = await this.updateLinkInNote({
          source,
          dest,
          id,
        });
        noteChangeEntries = noteChangeEntries.concat(changed);
      } catch (error) {
        this.L.error({ ctx, error });
      }
    });
    return noteChangeEntries;
  }

  /**
   * Given a source note, delete it
   * @param source source note
   */
  private async deleteSource(opts: { source: NoteProps }) {
    const ctx = `${this.key}:deleteSource`;
    const { source } = opts;
    try {
      const deleteResp = await this.extension.getEngine().deleteNote(source.id);
      if (deleteResp.data) {
        return deleteResp.data;
      } else {
        // This is very unlikely given a sound engine state.
        // log it and gracefully return
        return [];
      }
    } catch (error) {
      this.L.error({ ctx, error });
      return [];
    }
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

    // opts.notes should always have at most one element since we don't allow multiple destinations.
    const dest = opts.notes[0];
    const source = this.extension.wsUtils.getActiveNote();
    if (!source) {
      return {
        ...opts,
        changed: [],
      };
    }

    const appendNoteChanges = await this.appendNote({ source, dest });
    const updateBacklinksChanges = await this.updateBacklinks({ source, dest });
    const deleteSourceChanges = await this.deleteSource({ source });

    const noteChangeEntries = [
      ...appendNoteChanges,
      ...updateBacklinksChanges,
      ...deleteSourceChanges,
    ];

    // open the destination note
    await this.extension.wsUtils.openNote(dest);

    return {
      ...opts,
      changed: noteChangeEntries,
    };
  }
}
