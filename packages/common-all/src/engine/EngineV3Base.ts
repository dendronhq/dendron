import _ from "lodash";
import { BacklinkUtils } from "../BacklinkUtils";
import { ERROR_SEVERITY, ERROR_STATUS } from "../constants";
import { DLogger } from "../DLogger";
import { DNodeUtils, NoteUtils } from "../dnode";
import { DendronCompositeError, DendronError } from "../error";
import { INoteStore } from "../store";
import {
  BulkGetNoteMetaResp,
  BulkGetNoteResp,
  BulkWriteNotesOpts,
  BulkWriteNotesResp,
  DeleteNoteResp,
  DLink,
  EngineDeleteOpts,
  EngineWriteOptsV2,
  FindNotesMetaResp,
  FindNotesResp,
  GetNoteMetaResp,
  GetNoteResp,
  NoteChangeEntry,
  NoteProps,
  NotePropsMeta,
  QueryNotesMetaResp,
  QueryNotesOpts,
  QueryNotesResp,
  ReducedDEngine,
  RenameNoteOpts,
  RenameNoteResp,
  RenderNoteOpts,
  RenderNoteResp,
  RespV3,
  WriteNoteResp,
} from "../types";
import { DVault } from "../types/DVault";
import { FindNoteOpts } from "../types/FindNoteOpts";
import { isNotUndefined } from "../utils";
import { VaultUtils } from "../vault";

/**
 * Abstract base class that contains common logic between DendronEngineV3 and
 * DendronEngineV3Web
 */
export abstract class EngineV3Base implements ReducedDEngine {
  protected noteStore;
  protected logger;
  public vaults;
  public wsRoot;
  // TODO: Make configurable
  API_MAX_LIMIT = 100;

  constructor(opts: {
    noteStore: INoteStore<string>;
    logger: DLogger;
    vaults: DVault[];
    wsRoot: string;
  }) {
    this.noteStore = opts.noteStore;
    this.logger = opts.logger;
    this.vaults = opts.vaults;
    this.wsRoot = opts.wsRoot;
  }

  /**
   * See {@link DEngine.getNote}
   */
  async getNote(id: string): Promise<GetNoteResp> {
    return this.noteStore.get(id);
  }

  /**
   * See {@link DEngine.getNoteMeta}
   */
  async getNoteMeta(id: string): Promise<GetNoteMetaResp> {
    return this.noteStore.getMetadata(id);
  }

  /**
   * See {@link DEngine.bulkGetNotes}
   */
  async bulkGetNotes(ids: string[]): Promise<BulkGetNoteResp> {
    if (!ids || ids.length === 0) {
      return {
        data: [],
      };
    }

    const bulkResponses = await this.noteStore.bulkGet(ids);

    const errors = bulkResponses
      .flatMap((response) => response.error)
      .filter(isNotUndefined);

    return {
      error: errors.length > 0 ? new DendronCompositeError(errors) : undefined,
      data: bulkResponses
        .flatMap((response) => response.data)
        .filter(isNotUndefined),
    };
  }

  /**
   * See {@link DEngine.bulkGetNotesMeta}
   */
  async bulkGetNotesMeta(ids: string[]): Promise<BulkGetNoteMetaResp> {
    if (!ids || ids.length === 0) {
      return {
        data: [],
      };
    }

    const bulkResponses = await this.noteStore.bulkGetMetadata(ids);

    const errors = bulkResponses
      .flatMap((response) => response.error)
      .filter(isNotUndefined);

    return {
      error: errors.length > 0 ? new DendronCompositeError(errors) : undefined,
      data: bulkResponses
        .flatMap((response) => response.data)
        .filter(isNotUndefined),
    };
  }

  /**
   * See {@link DEngine.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<FindNotesResp> {
    const resp = await this.noteStore.find(opts);
    return resp.data ? resp.data : [];
  }

  /**
   * See {@link DEngine.findNotesMeta}
   */
  async findNotesMeta(opts: FindNoteOpts): Promise<FindNotesMetaResp> {
    const resp = await this.noteStore.findMetaData(opts);
    return resp.data ? resp.data : [];
  }

  /**
   * See {@link DEngine.bulkWriteNotes}
   */
  async bulkWriteNotes(opts: BulkWriteNotesOpts): Promise<BulkWriteNotesResp> {
    const writeResponses = await Promise.all(
      opts.notes.map((note) => this.writeNote(note, opts.opts))
    );
    const errors = writeResponses
      .flatMap((response) => response.error)
      .filter(isNotUndefined);

    return {
      error: errors.length > 0 ? new DendronCompositeError(errors) : undefined,
      data: writeResponses
        .flatMap((response) => response.data)
        .filter(isNotUndefined),
    };
  }

  /**
   * See {@link DEngine.deleteNote}
   */
  async deleteNote(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<DeleteNoteResp> {
    const ctx = "DEngine:deleteNote";
    if (id === "root") {
      throw new DendronError({
        message: "",
        status: ERROR_STATUS.CANT_DELETE_ROOT,
      });
    }
    let changes: NoteChangeEntry[] = [];

    const resp = await this.noteStore.getMetadata(id);
    if (resp.error) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message: `Unable to delete ${id}: Note does not exist`,
        }),
      };
    }
    // Temp solution to get around current restrictions where NoteChangeEntry needs a NoteProp
    const noteToDelete = _.merge(resp.data, {
      body: "",
    });
    this.logger.info({ ctx, noteToDelete, opts, id });
    const noteAsLog = NoteUtils.toLogObj(noteToDelete);

    if (!noteToDelete.parent) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
          message: `No parent found for ${noteToDelete.fname}`,
        }),
      };
    }
    const parentResp = await this.noteStore.get(noteToDelete.parent);
    if (parentResp.error) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
          message: `Unable to delete ${noteToDelete.fname}: Note's parent does not exist in engine: ${noteToDelete.parent}`,
          innerError: parentResp.error,
        }),
      };
    }

    let parentNote = parentResp.data;

    let prevNote = { ...noteToDelete };
    // If deleted note has children, create stub note with a new id in metadata store
    if (!_.isEmpty(noteToDelete.children)) {
      this.logger.info({ ctx, noteAsLog, msg: "keep as stub" });
      const replacingStub = NoteUtils.create({
        // the replacing stub should not keep the old note's body, id, and links.
        // otherwise, it will be captured while processing links and will
        // fail because this note is not actually in the file system.
        ..._.omit(noteToDelete, ["id", "links", "body"]),
        stub: true,
      });

      DNodeUtils.addChild(parentNote, replacingStub);

      // Move children to new note
      changes = changes.concat(
        await this.updateChildrenWithNewParent(noteToDelete, replacingStub)
      );

      changes.push({ note: replacingStub, status: "create" });
    } else {
      // If parent is a stub, go upwards up the tree and delete rest of stubs
      while (parentNote.stub) {
        changes.push({ note: parentNote, status: "delete" });
        if (!parentNote.parent) {
          return {
            error: new DendronError({
              status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
              message: `No parent found for ${parentNote.fname}`,
            }),
          };
        }
        // eslint-disable-next-line no-await-in-loop
        const parentResp = await this.noteStore.get(parentNote.parent);
        if (parentResp.data) {
          prevNote = { ...parentNote };
          parentNote = parentResp.data;
        } else {
          return {
            error: new DendronError({
              status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
              message: `Unable to delete ${noteToDelete.fname}: Note ${parentNote?.fname}'s parent does not exist in engine: ${parentNote.parent}`,
            }),
          };
        }
      }
    }

    // Delete note reference from parent's child
    const parentNotePrev = { ...parentNote };
    this.logger.info({ ctx, noteAsLog, msg: "delete from parent" });
    DNodeUtils.removeChild(parentNote, prevNote);

    // Add an entry for the updated parent
    changes.push({
      prevNote: parentNotePrev,
      note: parentNote,
      status: "update",
    });

    const deleteResp = opts?.metaOnly
      ? await this.noteStore.deleteMetadata(id)
      : await this.noteStore.delete(id);
    if (deleteResp.error) {
      return {
        error: new DendronError({
          message: `Unable to delete note ${id}`,
          severity: ERROR_SEVERITY.MINOR,
          payload: deleteResp.error,
        }),
      };
    }

    // Remove backlinks if applicable
    const backlinkChanges = await Promise.all(
      noteToDelete.links.map((link) => this.removeBacklink(link))
    );
    changes = changes.concat(backlinkChanges.flat());

    changes.push({ note: noteToDelete, status: "delete" });
    // Update metadata for all other changes
    await this.updateNoteMetadataStore(changes);

    this.logger.info({
      ctx,
      msg: "exit",
      changed: changes.map((n) => NoteUtils.toLogObj(n.note)),
    });
    return {
      data: changes,
    };
  }

  /**
   * See {@link DEngine.queryNotes}
   */
  async queryNotes(opts: QueryNotesOpts): Promise<QueryNotesResp> {
    const response = await this.noteStore.query(opts);
    if (response.isErr()) {
      throw new DendronError({
        message: "Error querying for notes with opts: " + opts,
        innerError: response.error,
      });
    }

    let items = response.value;
    if (items.length > this.API_MAX_LIMIT) {
      items = items.slice(0, this.API_MAX_LIMIT);
    }
    return items;
  }

  /**
   * See {@link DEngine.queryNotesMeta}
   */
  async queryNotesMeta(opts: QueryNotesOpts): Promise<QueryNotesMetaResp> {
    const response = await this.noteStore.queryMetadata(opts);
    if (response.isErr()) {
      throw new DendronError({
        message: "Error querying for notes with opts: " + opts,
        innerError: response.error,
      });
    }
    let items = response.value;
    // We should cap number of results sent over through the api,
    // otherwise it degrades performance
    if (items.length > this.API_MAX_LIMIT) {
      items = items.slice(0, this.API_MAX_LIMIT);
    }
    return items;
  }

  /**
   * See {@link DEngine.renameNote}
   */
  abstract renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp>;

  /**
   * See {@link DEngine.writeNote}
   */
  abstract writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp>;

  /**
   * Move children of old parent note to new parent
   * @return note change entries of modified children
   */
  protected async updateChildrenWithNewParent(
    oldParent: NotePropsMeta,
    newParent: NotePropsMeta
  ) {
    const changes: NoteChangeEntry[] = [];
    // Move existing note's children to new note
    const childrenResp = await this.noteStore.bulkGet(oldParent.children);
    childrenResp.forEach((child) => {
      if (child.data) {
        const childNote = child.data;
        const prevChildNoteState = { ...childNote };
        DNodeUtils.addChild(newParent, childNote);

        // Add one entry for each child updated
        changes.push({
          prevNote: prevChildNoteState,
          note: childNote,
          status: "update",
        });
      }
    });
    return changes;
  }

  /**
   * Update note metadata store based on note change entries
   * @param changes entries to update
   * @returns
   */
  protected async updateNoteMetadataStore(
    changes: NoteChangeEntry[]
  ): Promise<RespV3<string>[]> {
    return Promise.all(
      changes.map((change) => {
        switch (change.status) {
          case "delete": {
            return this.noteStore.deleteMetadata(change.note.id);
          }
          case "create":
          case "update": {
            return this.noteStore.writeMetadata({
              key: change.note.id,
              noteMeta: change.note,
            });
          }
          default:
            return { data: "" };
        }
      })
    );
  }

  /**
   * Create backlink from given link that references another note (denoted by presence of link.to field)
   * and add that backlink to referenced note's links
   *
   * @param link Link potentionally referencing another note
   */
  protected async addBacklink(link: DLink): Promise<NoteChangeEntry[]> {
    if (!link.to?.fname) {
      return [];
    }
    const maybeBacklink = BacklinkUtils.createFromDLink(link);
    if (maybeBacklink) {
      const maybeVault = link.to?.vaultName
        ? VaultUtils.getVaultByName({
            vname: link.to?.vaultName,
            vaults: this.vaults,
          })
        : undefined;
      const notes = await this.noteStore.find({
        fname: link.to.fname,
        vault: maybeVault,
      });
      if (notes.data) {
        return Promise.all(
          notes.data.map(async (note) => {
            const prevNote = _.cloneDeep(note);
            BacklinkUtils.addBacklinkInPlace({ note, backlink: maybeBacklink });
            return {
              prevNote,
              note,
              status: "update",
            };
          })
        );
      }
    }
    return [];
  }

  /**
   * Remove backlink associated with given link that references another note (denoted by presence of link.to field)
   * from that referenced note
   *
   * @param link Link potentially referencing another note
   */
  protected async removeBacklink(link: DLink): Promise<NoteChangeEntry[]> {
    if (!link.to?.fname) {
      return [];
    }
    const maybeBacklink = BacklinkUtils.createFromDLink(link);
    if (maybeBacklink) {
      const maybeVault = link.to?.vaultName
        ? VaultUtils.getVaultByName({
            vname: link.to?.vaultName,
            vaults: this.vaults,
          })
        : undefined;
      const notes = await this.noteStore.find({
        fname: link.to.fname,
        vault: maybeVault,
      });
      if (notes.data) {
        return Promise.all(
          notes.data.map(async (note) => {
            const prevNote = _.cloneDeep(note);
            BacklinkUtils.removeBacklinkInPlace({
              note,
              backlink: maybeBacklink,
            });
            return {
              prevNote,
              note,
              status: "update",
            };
          })
        );
      }
    }
    return [];
  }

  /**
   * See {@link DEngine.renderNote}
   */
  abstract renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp>;
}
