import Airtable, { Base, FieldSet, Records } from "@dendronhq/airtable";
import {
  DendronError,
  NoteProps,
  ResponseUtil,
  RespV2,
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { JSONSchemaType } from "ajv";
import {
  AirtableUtils,
  ConfigFileUtils,
  ExportPodV2,
  PersistedAirtablePodConfig,
  RunnableAirtableV2PodConfig,
} from "../../..";

type AirtableFieldsMap = { fields: { [key: string]: string | number } };

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

/**
 * Airtable Export Pod (V2 - for compatibility with Pod V2 workflow). This pod
 * will export data to a table row in Airtable. Currently, only exportNote() is
 * supported; exportText() is not currently supported.
 */
export class AirtableExportPodV2
  implements ExportPodV2<AirtableExportReturnType>
{
  private _config: RunnableAirtableV2PodConfig;
  private _airtableBase: Base;

  constructor(airtable: Airtable, config: RunnableAirtableV2PodConfig) {
    this._airtableBase = airtable.base(config.baseId);
    this._config = config;
  }

  async exportNote(input: NoteProps): Promise<AirtableExportReturnType> {
    const payload = this.getPayloadFromNote(input);

    try {
      let updated;
      let created;
      if (payload.update && payload.update.length > 0) {
        updated = await this._airtableBase(this._config.tableName).update(
          payload.update
        );
      }

      if (payload.create && payload.create.length > 0) {
        created = await this._airtableBase(this._config.tableName).create(
          payload.create
        );
      }

      return ResponseUtil.createHappyResponse({
        data: {
          created,
          updated,
        },
      });
    } catch (err: any) {
      return ResponseUtil.createUnhappyResponse({
        error: err as DendronError,
      });
    }
  }

  private getPayloadFromNote(note: NoteProps): {
    create: AirtableFieldsMap[];
    update: any[];
  } {
    const logger = createLogger("AirtablePublishPodV2");

    const { update, create } = AirtableUtils.notesToSrcFieldMap({
      notes: [note],
      srcFieldMapping: this._config.sourceFieldMapping,
      logger,
    });

    return { update, create };
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
      },
    }) as JSONSchemaType<PersistedAirtablePodConfig>;
  }
}
