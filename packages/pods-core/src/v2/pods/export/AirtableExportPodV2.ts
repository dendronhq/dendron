import Airtable, { Base, FieldSet, Record, Records } from "@dendronhq/airtable";
import {
  DendronCompositeError,
  DendronError,
  DEngineClient,
  IDendronError,
  minimatch,
  NoteProps,
  ResponseUtil,
  RespV2,
  RespV3,
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { JSONSchemaType } from "ajv";
import { RateLimiter } from "limiter";
import _ from "lodash";
import {
  AirtableUtils,
  ConfigFileUtils,
  ExportPodV2,
  PersistedAirtablePodConfig,
  RunnableAirtableV2PodConfig,
} from "../../..";

type AirtableFieldsMap = { fields: { [key: string]: string | number } };
export type AirtableExportPodV2Constructor = {
  airtable: Airtable;
  config: RunnableAirtableV2PodConfig;
  engine: DEngineClient;
};

export type AirtableExportReturnType = RespV2<{
  /**
   * New rows/records created in Airtable
   */
  created?: Records<FieldSet>;

  /**
   * Existing rows/records that were updated in Airtable
   */
  updated?: Records<FieldSet>;
}>;

class AirtableUtilsV2 {
  /***
   * Chunk all calls into records of 10 (Airtable API limit and call using limiter)
   */
  static async chunkAndCall(
    allRecords: AirtableFieldsMap[],
    limiter: RateLimiter,
    func: (record: any[]) => Promise<Records<FieldSet>>
  ) {
    const chunks = _.chunk(allRecords, 10);
    const errors: IDendronError[] = [];

    const out = await Promise.all(
      chunks.flatMap(async (record) => {
        await limiter.removeTokens(1);
        try {
          const _records = await func(record);
          return _records;
        } catch (error) {
          const _error = new DendronError({
            innerError: error as Error,
            payload: record,
            message: "error with airtable",
          });
          errors.push(_error);
          return;
        }
      })
    );
    return {
      data: _.flatten(out).filter(
        (ent): ent is Record<FieldSet> => !_.isUndefined(ent)
      ),
      errors,
    };
  }
}

/**
 * Airtable Export Pod (V2 - for compatibility with Pod V2 workflow). This pod
 * will export data to a table row in Airtable.
 */
export class AirtableExportPodV2
  implements ExportPodV2<AirtableExportReturnType>
{
  private _config: RunnableAirtableV2PodConfig;
  private _airtableBase: Base;
  private _engine: DEngineClient;

  constructor({ airtable, config, engine }: AirtableExportPodV2Constructor) {
    this._airtableBase = airtable.base(config.baseId);
    this._config = config;
    this._engine = engine;
  }

  private cleanNotes(notes: NoteProps[], fnameFilters: string[]): NoteProps[] {
    return _.reject(notes, (ent) => {
      return _.some(fnameFilters, (pat) => minimatch(ent.fname, pat));
    });
  }

  async exportNote(input: NoteProps): Promise<AirtableExportReturnType> {
    return this.exportNotes([input]);
  }

  async exportNotes(input: NoteProps[]): Promise<AirtableExportReturnType> {
    input = this.cleanNotes(input, _.get(this._config, "filters.fname"));
    const resp = this.getPayloadForNotes(input);
    if (resp.error) {
      return {
        data: {},
        error: resp.error,
      };
    }
    const { create, update } = resp.data;
    const limiter = new RateLimiter({
      tokensPerInterval: 5,
      interval: "second",
    });
    const createRequest = await AirtableUtilsV2.chunkAndCall(
      create,
      limiter,
      this._airtableBase(this._config.tableName).create
    );
    const updateRequest = await AirtableUtilsV2.chunkAndCall(
      update,
      limiter,
      this._airtableBase(this._config.tableName).update
    );

    const errors = createRequest.errors.concat(updateRequest.errors);
    const data = {
      created: createRequest.data,
      updated: updateRequest.data,
    };

    if (errors.length > 0) {
      return {
        data,
        error: new DendronCompositeError(errors),
      };
    } else {
      return ResponseUtil.createHappyResponse({
        data,
      });
    }
  }

  /**
   * Get mapping of fields that will be updated in airtable
   * @param notes
   * @returns
   */
  private getPayloadForNotes(notes: NoteProps[]): RespV3<{
    create: AirtableFieldsMap[];
    update: any[];
  }> {
    const logger = createLogger("AirtablePublishPodV2");

    const resp = AirtableUtils.notesToSrcFieldMap({
      notes,
      srcFieldMapping: this._config.sourceFieldMapping,
      logger,
      engine: this._engine,
    });
    return resp;
  }

  static config(): JSONSchemaType<PersistedAirtablePodConfig> {
    return ConfigFileUtils.createExportConfig({
      required: ["connectionId", "baseId", "tableName", "sourceFieldMapping"],
      properties: {
        connectionId: {
          description: "ID of the Airtable Connected Service",
          type: "string",
        },
        baseId: {
          description: "airtable base id",
          type: "string",
        },
        tableName: { type: "string", description: "Name of the airtable" },
        sourceFieldMapping: {
          type: "object",
          required: [],
          description:
            "mapping of airtable fields with the note eg: {Created On: created, Notes: body}",
        },
        filters: {
          type: "object",
          required: [],
          nullable: true,
          properties: {
            fname: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
      },
    }) as JSONSchemaType<PersistedAirtablePodConfig>;
  }
}
