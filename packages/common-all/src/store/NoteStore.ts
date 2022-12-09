import _ from "lodash";
import { URI, Utils } from "vscode-uri";
import { ERROR_SEVERITY, ERROR_STATUS, StatusCodes } from "../constants";
import { NoteUtils } from "../dnode";
import { DendronError, IDendronError } from "../error";
import {
  DNoteLoc,
  NoteProps,
  NotePropsMeta,
  QueryNotesOpts,
  RespV3,
  WriteNoteMetaOpts,
  WriteNoteOpts,
} from "../types";
import { FindNoteOpts } from "../types/FindNoteOpts";
import { genHash, isNotUndefined, ResultAsync } from "../utils";
import { VaultUtils } from "../vault";
import { IDataStore } from "./IDataStore";
import { IFileStore } from "./IFileStore";
import { INoteStore } from "./INoteStore";

/**
 * Responsible for storing NoteProps non-metadata and NoteProps metadata
 */
export class NoteStore implements INoteStore<string> {
  private _fileStore: IFileStore;
  private _metadataStore: IDataStore<string, NotePropsMeta>;
  private _wsRoot: URI;

  constructor(
    fileStore: IFileStore,
    dataStore: IDataStore<string, NotePropsMeta>,
    wsRoot: URI
  ) {
    this._fileStore = fileStore;
    this._metadataStore = dataStore;
    this._wsRoot = wsRoot;
  }

  dispose() {
    this._metadataStore.dispose();
  }

  /**
   * See {@link INoteStore.get}
   */
  async get(key: string): Promise<RespV3<NoteProps>> {
    const metadata = await this.getMetadata(key);
    if (metadata.error) {
      return { error: metadata.error };
    }
    // If note is a stub, return stub note
    if (metadata.data.stub) {
      return {
        data: { ...metadata.data, body: "" },
      };
    }

    // vault.fsPath that comes from local overrides can be absolute paths (e.g. if scope is global).
    // need to slice the absolute portion off to correctly resolve.
    // if a relative path comes in, this will do nothing and work as intended
    const processedVault = metadata.data.vault.fsPath.startsWith(
      this._wsRoot.fsPath
    )
      ? {
          ...metadata.data.vault,
          fsPath: metadata.data.vault.fsPath.slice(this._wsRoot.fsPath.length),
        }
      : metadata.data.vault;

    const uri = Utils.joinPath(
      this._wsRoot,
      VaultUtils.getRelPath({
        ...processedVault,
      }),
      metadata.data.fname + ".md"
    );

    const nonMetadata = await this._fileStore.read(uri);
    if (nonMetadata.error) {
      return { error: nonMetadata.error };
    }

    // Parse file for note body since we don't have that in metadata
    const capture = nonMetadata.data.match(/^---[\s\S]+?---/);
    if (capture) {
      const offset = capture[0].length;
      const body = nonMetadata.data.slice(offset + 1);
      const note = {
        ...metadata.data,
        body,
      };
      return { data: note };
    } else {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
          message: `Frontmatter missing for file ${uri.fsPath} associated with note ${key}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link INoteStore.bulkGet}
   */
  async bulkGet(keys: string[]): Promise<RespV3<NoteProps>[]> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  /**
   * See {@link INoteStore.getMetadata}
   */
  async getMetadata(key: string): Promise<RespV3<NotePropsMeta>> {
    return this._metadataStore.get(key);
  }

  /**
   * See {@link INoteStore.bulkGetMetadata}
   */
  async bulkGetMetadata(keys: string[]): Promise<RespV3<NotePropsMeta>[]> {
    return Promise.all(keys.map((key) => this.getMetadata(key)));
  }

  /**
   * See {@link INoteStore.find}
   */
  async find(opts: FindNoteOpts): Promise<RespV3<NoteProps[]>> {
    const noteMetadata = await this.findMetaData(opts);
    if (noteMetadata.error) {
      return { error: noteMetadata.error };
    }

    const responses = await Promise.all(
      noteMetadata.data.map((noteMetadata) => this.get(noteMetadata.id))
    );
    return {
      data: responses.map((resp) => resp.data).filter(isNotUndefined),
    };
  }

  /**
   * See {@link INoteStore.findMetaData}
   */
  async findMetaData(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>> {
    return this._metadataStore.find(opts);
  }

  /**
   * See {@link INoteStore.write}
   */
  async write(opts: WriteNoteOpts<string>): Promise<RespV3<string>> {
    const { key, note } = opts;
    const notePropsMeta: NotePropsMeta = _.omit(note, ["body"]);
    const content = NoteUtils.serialize(note);
    const noteMeta = {
      ...notePropsMeta,
      contentHash: genHash(content),
    };
    const metaResp = await this.writeMetadata({ key, noteMeta });
    if (metaResp.error) {
      return { error: metaResp.error };
    }

    // If note is a stub, do not write to file
    if (!noteMeta.stub) {
      const uri = Utils.joinPath(
        this._wsRoot,
        VaultUtils.getRelPath(note.vault),
        note.fname + ".md"
      );
      const writeResp = await this._fileStore.write(uri, content);
      if (writeResp.error) {
        return { error: writeResp.error };
      }
    }

    return { data: key };
  }

  /**s
   * See {@link INoteStore.writeMetadata}
   */
  async writeMetadata(
    opts: WriteNoteMetaOpts<string>
  ): Promise<RespV3<string>> {
    const { key, noteMeta } = opts;

    // Ids don't match, return error
    if (key !== noteMeta.id) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.WRITE_FAILED,
          message: `Ids don't match between key ${key} and note meta ${noteMeta}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
    return this._metadataStore.write(key, noteMeta);
  }

  /**
   * See {@link INoteStore.bulkWriteMetadata}
   */
  async bulkWriteMetadata(
    opts: WriteNoteMetaOpts<string>[]
  ): Promise<RespV3<string>[]> {
    return Promise.all(
      opts.map((writeMetaOpt) => {
        return this.writeMetadata(writeMetaOpt);
      })
    );
  }

  /**
   * See {@link INoteStore.delete}
   */
  async delete(key: string): Promise<RespV3<string>> {
    const metadata = await this.getMetadata(key);
    if (metadata.error) {
      return { error: metadata.error };
    }
    const resp = await this.deleteMetadata(key);
    if (resp.error) {
      return { error: resp.error };
    }

    // If note is a stub, do not delete from file store since it won't exist
    if (!metadata.data.stub) {
      const uri = Utils.joinPath(
        this._wsRoot,
        VaultUtils.getRelPath(metadata.data.vault),
        metadata.data.fname + ".md"
      );
      const deleteResp = await this._fileStore.delete(uri);
      if (deleteResp.error) {
        return { error: deleteResp.error };
      }
    }

    return { data: key };
  }

  /**
   * See {@link INoteStore.deleteMetadata}
   */
  async deleteMetadata(key: string): Promise<RespV3<string>> {
    const metadata = await this.getMetadata(key);
    if (metadata.error) {
      return { error: metadata.error };
    } else if (metadata.data.fname === "root") {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CANT_DELETE_ROOT,
          message: `Cannot delete ${key}. Root notes cannot be deleted.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }

    return this._metadataStore.delete(key);
  }

  async rename(oldLoc: DNoteLoc, newLoc: DNoteLoc): Promise<RespV3<string>> {
    // TODO: implement
    const test = oldLoc.fname + newLoc.fname;
    return { data: test };
  }

  /**
   * See {@link INoteStore.query}
   */
  query(
    opts: QueryNotesOpts
  ): ResultAsync<NoteProps[], IDendronError<StatusCodes | undefined>> {
    const result = this._metadataStore
      .query(opts)
      .map((items) => {
        return this.bulkGet(items.map((ent) => ent.id));
      })
      .map((responses) =>
        responses.map((resp) => resp.data).filter(isNotUndefined)
      );

    return result;
  }

  /**
   * See {@link INoteStore.queryMetadata}
   */
  queryMetadata(
    opts: QueryNotesOpts
  ): ResultAsync<NotePropsMeta[], IDendronError<StatusCodes | undefined>> {
    return this._metadataStore.query(opts);
  }
}
