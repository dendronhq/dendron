import {
  cleanName,
  DendronError,
  DNodeUtils,
  DVault,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  IDataStore,
  isNotUndefined,
  NoteFnameDictUtils,
  NotePropsByFnameDict,
  NotePropsMeta,
  RespV3,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";

export class NoteMetadataStore implements IDataStore<string, NotePropsMeta> {
  /**
   * Map of noteId -> noteProp metadata
   */
  private _noteMetadataById: Record<string, NotePropsMeta>;
  /**
   * Map of noteFname -> list of noteIds. Since fname is not unique across vaults, there can be multiple ids with the same fname
   */
  private _noteIdsByFname: NotePropsByFnameDict;

  constructor() {
    this._noteMetadataById = {};
    this._noteIdsByFname = {};
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
    const { fname, vault, child } = opts;
    let noteMetadata: NotePropsMeta[] = [];

    if (child) {
      const ancestorResp = await this.findClosestAncestor(
        child.fname,
        child.vault
      );
      if (ancestorResp.error) {
        return { error: ancestorResp.error };
      }
      noteMetadata = [ancestorResp.data];
    }

    if (fname) {
      const cleanedFname = cleanName(fname);
      let ids: string[] | undefined;
      if (child) {
        ids = noteMetadata
          .filter((note) => note.fname === cleanedFname)
          .map((note) => note.id);
      } else {
        ids = this._noteIdsByFname[cleanedFname];
      }
      if (!ids) {
        return { data: [] };
      }
      noteMetadata = ids
        .map((id) => this._noteMetadataById[id])
        .filter(isNotUndefined);
    }

    if (vault) {
      // If other properties are not set, then filter entire note set instead
      if (!fname && !child) {
        noteMetadata = _.values(this._noteMetadataById);
      }
      noteMetadata = noteMetadata.filter((note) =>
        VaultUtils.isEqualV2(note.vault, vault)
      );
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
      if (cleanName(maybeNote.fname) === cleanName(data.fname)) {
        this._noteMetadataById[data.id] = data;
        return { data: key };
      } else {
        // Remove old fname from fname dict
        NoteFnameDictUtils.delete(maybeNote, this._noteIdsByFname);
      }
    }
    this._noteMetadataById[data.id] = data;
    NoteFnameDictUtils.add(data, this._noteIdsByFname);

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
    }
    delete this._noteMetadataById[key];

    return { data: key };
  }

  /**
   * Recursively search through fname to find next available ancestor note.
   *
   * E.g, if fpath = "baz.foo.bar", search for "baz.foo", then "baz", then "root" until first valid note is found
   * @param fpath of note to find ancestor of
   * @param vault of ancestor note
   * @returns closest ancestor note
   */
  private async findClosestAncestor(
    fpath: string,
    vault: DVault
  ): Promise<RespV3<NotePropsMeta>> {
    const dirname = DNodeUtils.dirName(fpath);
    // Reached the end, must be root note
    if (dirname === "") {
      const rootResp = await this.find({ fname: "root", vault });
      if (rootResp.error || rootResp.data.length === 0) {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
            message: `No root found for ${fpath}.`,
            innerError: rootResp.error,
            severity: ERROR_SEVERITY.MINOR,
          }),
        };
      }
      return { data: rootResp.data[0] };
    }
    const parentResp = await this.find({ fname: dirname, vault });
    if (parentResp.data && parentResp.data.length > 0) {
      return { data: parentResp.data[0] };
    } else {
      return this.findClosestAncestor(dirname, vault);
    }
  }
}
