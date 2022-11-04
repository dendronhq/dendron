import _ from "lodash";
import { ResultAsync } from "neverthrow";
import { ERROR_SEVERITY, ERROR_STATUS, StatusCodes } from "../constants";
import { DendronError } from "../error";
import { FuseEngine } from "../FuseEngine";
import { QuerySchemaOpts, RespV3, SchemaModuleProps } from "../types";
import { isNotUndefined } from "../utils";
import { IDataStore } from "./IDataStore";

export class SchemaMetadataStore
  implements IDataStore<string, SchemaModuleProps>
{
  /**
   * Map of schema root id -> SchemaModuleProps
   */
  private _schemaMetadataById: Record<string, SchemaModuleProps>;
  private _fuseEngine: FuseEngine;

  constructor(fuseEngine: FuseEngine) {
    this._schemaMetadataById = {};
    this._fuseEngine = fuseEngine;
  }

  dispose() {
    this._schemaMetadataById = {};
    this._fuseEngine.replaceSchemaIndex({});
  }

  /**
   * See {@link IDataStore.get}
   */
  async get(key: string): Promise<RespV3<SchemaModuleProps>> {
    const maybeSchema = this._schemaMetadataById[key];

    if (maybeSchema) {
      return { data: _.cloneDeep(maybeSchema) };
    } else {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `SchemaModuleProps not found for key ${key}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  async find(_opts: any): Promise<RespV3<SchemaModuleProps[]>> {
    throw new Error("Method not implemented.");
  }

  /**
   * See {@link IDataStore.write}
   *
   * Add schema to _schemaMetadataById. If schema root id already exists, override existing schema
   */
  async write(key: string, data: SchemaModuleProps): Promise<RespV3<string>> {
    const maybeSchema = this._schemaMetadataById[data.root.id];
    this._schemaMetadataById[data.root.id] = data;

    if (maybeSchema) {
      // Fuse has no update. Must remove first
      this._fuseEngine.removeSchemaFromIndex(maybeSchema);
    }
    this._fuseEngine.addSchemaToIndex(data);

    return { data: key };
  }

  /**
   * See {@link IDataStore.delete}
   *
   * Remove schema from both _schemaMetadataById and fuseEngine.
   */
  async delete(key: string): Promise<RespV3<string>> {
    const maybeSchema = this._schemaMetadataById[key];
    if (maybeSchema) {
      this._fuseEngine.removeSchemaFromIndex(maybeSchema);
    }
    delete this._schemaMetadataById[key];

    return { data: key };
  }

  /**
   * See {@link IDataStore.query}
   */
  query(
    opts: QuerySchemaOpts
  ): ResultAsync<SchemaModuleProps[], DendronError<StatusCodes | undefined>> {
    const schemaIds = this._fuseEngine.querySchema(opts);
    const items = Promise.all(
      schemaIds.map(async (ent) => {
        const resp = await this.get(ent.id);
        return resp.data;
      })
    ).then((result) => result.filter(isNotUndefined));
    return ResultAsync.fromSafePromise(Promise.resolve(items));
  }
}
