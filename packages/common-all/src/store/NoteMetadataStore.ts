import _ from "lodash";
import { ERROR_STATUS, ERROR_SEVERITY, StatusCodes } from "../constants";
import { DendronError } from "../error";
import { FuseEngine } from "../FuseEngine";
import { NoteFnameDictUtils } from "../noteDictsUtils";
import {
  NotePropsMeta,
  NotePropsByFnameDict,
  RespV3,
  QueryNotesOpts,
} from "../types";
import { FindNoteOpts } from "../types/FindNoteOpts";
import { cleanName, isNotUndefined, ResultAsync } from "../utils";
import { VaultUtils } from "../vault";
import { INoteMetadataStore } from "./IMetadataStore";

export class NoteMetadataStore implements INoteMetadataStore {
  /**
   * Map of noteId -> noteProp metadata
   */
  private _noteMetadataById: Record<string, NotePropsMeta>;
  /**
   * Map of noteFname -> list of noteIds. Since fname is not unique across vaults, there can be multiple ids with the same fname
   */
  private _noteIdsByFname: NotePropsByFnameDict;
  private _fuseEngine: FuseEngine;

  constructor(fuseEngine: FuseEngine) {
    this._noteMetadataById = {};
    this._noteIdsByFname = {};
    this._fuseEngine = fuseEngine;
  }

  dispose() {
    this._noteMetadataById = {};
    this._noteIdsByFname = {};
    this._fuseEngine.replaceNotesIndex({});
  }

  /**
   * See {@link IDataStore.get}
   */
  async get(key: string): Promise<RespV3<NotePropsMeta>> {
    const maybeNote = this._noteMetadataById[key];

    if (maybeNote) {
      return { data: _.cloneDeep(maybeNote) };
    } else {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `NoteProps metadata not found for key ${key}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link IDataStore.find}
   */
  async find(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>> {
    const { fname, vault, excludeStub } = opts;
    if (!fname && !vault && _.isUndefined(excludeStub)) {
      return { data: [] };
    }
    let noteMetadata: NotePropsMeta[];

    if (fname) {
      const cleanedFname = cleanName(fname);
      const ids = this._noteIdsByFname[cleanedFname];
      if (!ids) {
        return { data: [] };
      }
      noteMetadata = ids
        .map((id) => this._noteMetadataById[id])
        .filter(isNotUndefined);
    } else {
      noteMetadata = _.values(this._noteMetadataById);
    }

    if (vault) {
      // Need to ignore this because the engine stringifies this property, so the types are incorrect.
      // @ts-ignore
      if (vault?.selfContained === "true" || vault?.selfContained === "false") {
        vault.selfContained = vault.selfContained === "true";
      }
      noteMetadata = noteMetadata.filter((note) =>
        VaultUtils.isEqualV2(note.vault, vault)
      );
    }

    if (excludeStub) {
      noteMetadata = noteMetadata.filter((note) => note.stub !== true);
    }
    return { data: _.cloneDeep(noteMetadata) };
  }

  /**
   * See {@link IDataStore.write}
   *
   * Add note to _noteMetadataById and _noteIdsByFname.
   * If note id already exists, check to see if it corresponds to same note by fname.
   * If fname match, then we only need to update _noteMetadataById. If fname doesn't match, remove old id from _noteIdsByFname first before updating both.
   *
   * Otherwise, if note id doesn't exist, add to both dictionaries
   */
  async write(key: string, data: NotePropsMeta): Promise<RespV3<string>> {
    const maybeNote = this._noteMetadataById[data.id];

    if (maybeNote) {
      // Fuse has no update. Must remove first
      this._fuseEngine.removeNoteFromIndex(maybeNote);
      if (cleanName(maybeNote.fname) === cleanName(data.fname)) {
        this._fuseEngine.addNoteToIndex(data);
        this._noteMetadataById[data.id] = data;
        return { data: key };
      } else {
        // Remove old fname from fname dict
        NoteFnameDictUtils.delete(maybeNote, this._noteIdsByFname);
      }
    }
    this._noteMetadataById[data.id] = data;
    NoteFnameDictUtils.add(data, this._noteIdsByFname);
    this._fuseEngine.addNoteToIndex(data);

    return { data: key };
  }

  /**
   * See {@link IDataStore.delete}
   *
   * Remove note from both _noteMetadataById and _noteIdsByFname.
   */
  async delete(key: string): Promise<RespV3<string>> {
    const maybeNote = this._noteMetadataById[key];
    if (maybeNote) {
      NoteFnameDictUtils.delete(maybeNote, this._noteIdsByFname);
      this._fuseEngine.removeNoteFromIndex(maybeNote);
    }
    delete this._noteMetadataById[key];

    return { data: key };
  }

  /**
   * See {@link IDataStore.query}
   */
  query(
    opts: QueryNotesOpts
  ): ResultAsync<NotePropsMeta[], DendronError<StatusCodes | undefined>> {
    const { vault } = opts;
    let results = this._fuseEngine.queryNote({
      ...opts,
    });
    if (vault) {
      // Need to ignore this because the engine stringifies this property, so the types are incorrect.
      // @ts-ignore
      if (vault?.selfContained === "true" || vault?.selfContained === "false") {
        vault.selfContained = vault.selfContained === "true";
      }
      results = results.filter((ent) => {
        return VaultUtils.isEqualV2(ent.vault, vault);
      });
    }
    const items = results.map((result) => this._noteMetadataById[result.id]);
    return ResultAsync.fromSafePromise(Promise.resolve(items));
  }
}
