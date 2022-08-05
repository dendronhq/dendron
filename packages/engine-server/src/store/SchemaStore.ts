import {
  DendronError,
  Disposable,
  ERROR_SEVERITY,
  ERROR_STATUS,
  IDataStore,
  IFileStore,
  ISchemaStore,
  RespV3,
  SchemaModuleProps,
  SchemaUtils,
  WriteSchemaOpts,
} from "@dendronhq/common-all";
import {
  createDisposableLogger,
  DLogger,
  serializeModuleProps,
} from "@dendronhq/common-server";

export class SchemaStore implements Disposable, ISchemaStore<string> {
  private _fileStore: IFileStore;
  private _metadataStore: IDataStore<string, SchemaModuleProps>;
  private _wsRoot: string;
  private _logger: DLogger;
  private _loggerDispose: () => any;

  constructor(opts: {
    fileStore: IFileStore;
    dataStore: IDataStore<string, SchemaModuleProps>;
    wsRoot: string;
  }) {
    this._fileStore = opts.fileStore;
    this._metadataStore = opts.dataStore;
    this._wsRoot = opts.wsRoot;
    const { logger, dispose } = createDisposableLogger();
    this._logger = logger;
    this._loggerDispose = dispose;
  }

  dispose() {
    this._loggerDispose();
  }

  /**
   * See {@link ISchemaStore.getMetadata}
   */
  async getMetadata(key: string): Promise<RespV3<SchemaModuleProps>> {
    const ctx = "SchemaStore:getMetadata";
    this._logger.info({ ctx, msg: `Getting SchemaModuleProps for ${key}` });
    return this._metadataStore.get(key);
  }

  /**
   * See {@link ISchemaStore.write}
   */
  async write(opts: WriteSchemaOpts<string>): Promise<RespV3<string>> {
    const { key, schema } = opts;

    const metaResp = await this.writeMetadata({ key, schema });
    if (metaResp.error) {
      return { error: metaResp.error };
    }

    const uri = SchemaUtils.getURI({ schema, wsRoot: this._wsRoot });
    const writeResp = await this._fileStore.write(
      uri,
      serializeModuleProps(schema)
    );
    if (writeResp.error) {
      return { error: writeResp.error };
    }

    return { data: key };
  }

  /**
   * See {@link ISchemaStore.bulkWriteMetadata}
   */
  async bulkWriteMetadata(
    opts: WriteSchemaOpts<string>[]
  ): Promise<RespV3<string>[]> {
    return Promise.all(
      opts.map((writeMetaOpt) => {
        return this.writeMetadata(writeMetaOpt);
      })
    );
  }

  /**
   * See {@link ISchemaStore.writeMetadata}
   */
  async writeMetadata(opts: WriteSchemaOpts<string>): Promise<RespV3<string>> {
    const { key, schema } = opts;

    // Ids don't match, return error
    if (key !== schema.root.id) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.WRITE_FAILED,
          message: `Ids don't match between key ${key} and schema ${schema}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
    return this._metadataStore.write(key, schema);
  }

  /**
   * See {@link ISchemaStore.delete}
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

    const uri = SchemaUtils.getURI({
      schema: metadata.data,
      wsRoot: this._wsRoot,
    });
    const deleteResp = await this._fileStore.delete(uri);
    if (deleteResp.error) {
      return { error: deleteResp.error };
    }

    return { data: key };
  }

  /**
   * See {@link ISchemaStore.deleteMetadata}
   */
  async deleteMetadata(key: string): Promise<RespV3<string>> {
    const metadata = await this.getMetadata(key);
    if (metadata.error) {
      return { error: metadata.error };
    } else if (metadata.data.fname === "root") {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CANT_DELETE_ROOT,
          message: `Cannot delete ${key}. Root schemas cannot be deleted.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }

    return this._metadataStore.delete(key);
  }
}
