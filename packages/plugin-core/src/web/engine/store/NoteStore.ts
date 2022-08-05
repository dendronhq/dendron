import {
  DendronCompositeError,
  DendronError,
  Disposable,
  DNoteLoc,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  genHash,
  IDataStore,
  IFileStore,
  INoteStore,
  isNotUndefined,
  NoteProps,
  NotePropsMeta,
  NoteUtils,
  RespV3,
  WriteNoteMetaOpts,
  WriteNoteOpts,
} from "@dendronhq/common-all";
// import { createDisposableLogger, DLogger } from "@dendronhq/common-server";
import _ from "lodash";
import { inject, singleton } from "tsyringe";

/**
 * Responsible for storing NoteProps non-metadata and NoteProps metadata
 */
@singleton()
export class NoteStore implements Disposable, INoteStore<string> {
  private _metadataStore: IDataStore<string, NotePropsMeta>;
  private _wsRoot: string;
  // private _logger: DLogger;
  // private _loggerDispose: () => any;

  constructor(
    @inject("IFileStore") private fileStore: IFileStore,
    @inject("IDataStore") dataStore: IDataStore<string, NotePropsMeta>,
    @inject("wsRootString") wsRoot: string
  ) {
    this.fileStore = fileStore;
    this._metadataStore = dataStore;
    this._wsRoot = wsRoot;
    // const { logger, dispose } = createDisposableLogger();
    // this._logger = logger;
    // this._loggerDispose = dispose;
  }

  dispose() {
    // this._loggerDispose();
  }

  /**
   * See {@link INoteStore.get}
   */
  async get(key: string): Promise<RespV3<NoteProps>> {
    const ctx = "NoteStore:get";
    // this._logger.info({ ctx, msg: `Getting NoteProps for ${key}` });
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
    const uri = NoteUtils.getURI({ note: metadata.data, wsRoot: this._wsRoot });
    const nonMetadata = await this.fileStore.read(uri);
    if (nonMetadata.error) {
      return { error: nonMetadata.error };
    }

    // Parse file for note body since we don't have that in metadata
    const capture = nonMetadata.data.match(/^---[\s\S]+?---/);
    if (capture) {
      const offset = capture[0].length;
      const body = nonMetadata.data.slice(offset + 1);
      // add `contentHash` to this signature because its not saved with metadata
      const note = {
        ...metadata.data,
        body,
        contentHash: genHash(nonMetadata.data),
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
    const ctx = "NoteStore:bulkGet";
    // this._logger.info({ ctx, msg: `Bulk getting NoteProps for ${keys}` });

    return Promise.all(keys.map((key) => this.get(key)));
  }

  /**
   * See {@link INoteStore.getMetadata}
   */
  async getMetadata(key: string): Promise<RespV3<NotePropsMeta>> {
    const resp = await this._metadataStore.get(key);
    if (resp.error) {
      return { error: resp.error };
    }
    return { data: resp.data };
  }

  /**
   * See {@link INoteStore.find}
   */
  async find(opts: FindNoteOpts): Promise<RespV3<NoteProps[]>> {
    const noteMetadata = await this.findMetaData(opts);
    if (noteMetadata.error) {
      return { error: new DendronCompositeError([noteMetadata.error]) };
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
    const resp = await this._metadataStore.find(opts);
    if (resp.error) {
      return { error: resp.error };
    }
    return { data: resp.data };
  }

  /**
   * See {@link INoteStore.write}
   */
  async write(opts: WriteNoteOpts<string>): Promise<RespV3<string>> {
    const { key, note } = opts;
    const noteMeta: NotePropsMeta = _.omit(note, ["body", "contentHash"]);
    const metaResp = await this.writeMetadata({ key, noteMeta });
    if (metaResp.error) {
      return { error: metaResp.error };
    }

    // If note is a stub, do not write to file
    if (!noteMeta.stub) {
      const uri = NoteUtils.getURI({ note, wsRoot: this._wsRoot });
      const content = NoteUtils.serialize(note, { excludeStub: true });
      const writeResp = await this.fileStore.write(uri, content);
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
    const metaResp = await this._metadataStore.write(key, noteMeta);
    if (metaResp.error) {
      return { error: metaResp.error };
    }

    return { data: key };
  }

  /**s
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
      const uri = NoteUtils.getURI({
        note: metadata.data,
        wsRoot: this._wsRoot,
      });
      const deleteResp = await this.fileStore.delete(uri);
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

    const metaResp = await this._metadataStore.delete(key);
    if (metaResp.error) {
      return { error: metaResp.error };
    }

    return { data: key };
  }

  async rename(oldLoc: DNoteLoc, newLoc: DNoteLoc): Promise<RespV3<string>> {
    // TODO: implement
    const test = oldLoc.fname + newLoc.fname;
    return { data: test };
  }
}
