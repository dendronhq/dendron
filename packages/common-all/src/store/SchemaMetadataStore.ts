import _ from "lodash";
import { ERROR_SEVERITY, ERROR_STATUS } from "../constants";
import { DendronError } from "../error";
import { RespV3, SchemaModuleProps } from "../types";
import { IDataStore } from "./IDataStore";

export class SchemaMetadataStore
  implements IDataStore<string, SchemaModuleProps>
{
  /**
   * Map of schema root id -> SchemaModuleProps
   */
  private _schemaMetadataById: Record<string, SchemaModuleProps>;

  constructor() {
    this._schemaMetadataById = {};
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
    this._schemaMetadataById[data.root.id] = data;

    return { data: key };
  }

  /**
   * See {@link IDataStore.delete}
   *
   * Remove schema from both _schemaMetadataById.
   */
  async delete(key: string): Promise<RespV3<string>> {
    delete this._schemaMetadataById[key];

    return { data: key };
  }
}
