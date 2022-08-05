import {
  asyncLoopOneAtATime,
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

type CommandOutput = {};

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
      return {};
    }

    const destNote = opts.notes[0];
    const sourceNote = this.extension.wsUtils.getActiveNote();
    if (!sourceNote) {
      return {};
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
    console.log({ sourceNoteBacklinks });

    const noteIDsToUpdate = Array.from(
      new Set(
        sourceNoteBacklinks
          .map((backlink) => backlink.from.id)
          .filter((ent): ent is string => ent !== undefined)
      )
    );

    await asyncLoopOneAtATime(noteIDsToUpdate, async (id) => {
      const noteToUpdate = await this.extension.getEngine().getNote(id);
      if (noteToUpdate !== undefined) {
        const linksToUpdate = noteToUpdate.links.filter(
          (link) => link.value === sourceNote.fname
        );
        console.log({ linksToUpdate });
        const noteToUpdateDeepCopy = _.cloneDeep(noteToUpdate);
        const modifiedNote = await _.reduce<
          typeof linksToUpdate[0],
          Promise<NoteProps>
        >(
          linksToUpdate,
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
                fname: destNote.fname,
                vaultName: VaultUtils.getName(destNote.vault),
              },
              data: {
                xvault: isXVault,
              },
            };
            console.log({ newLink });
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
        console.log({ modifiedNote });

        noteToUpdate.body = modifiedNote.body;
        const writeResp = await this.extension
          .getEngine()
          .writeNote(noteToUpdate);
        console.log({ writeResp });
      }
    });
    // delete old note
    return {};
  }
}
