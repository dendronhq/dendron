import {
  asyncLoop,
  asyncRetry,
  Deferred,
  DendronCompositeError,
  DendronError,
  DEngineClient,
  IDendronError,
  NoteProps,
  ResponseUtil,
  RespV2,
} from "@dendronhq/common-all";
import { JSONSchemaType } from "ajv";
import { RateLimiter } from "limiter";
import _ from "lodash";
import {
  Client,
  ConfigFileUtils,
  ExportPodV2,
  NotionExportPod,
  NotionV2PodConfig,
  RunnableNotionV2PodConfig,
} from "../../..";

export type NotionExportReturnType = RespV2<{
  created?: NotionFields[];
}>;

export type NotionFields = {
  /**
   * Document Id of the notion doc created
   */
  notionId: string;
  /**
   *  dendron id of note
   */
  dendronId: string;
};

// Allow 3 req/sec (the Notion API limit). Also understands 'hour', 'minute', 'day', or a no. of ms
// @ts-ignore
const limiter = new RateLimiter({ tokensPerInterval: 3, interval: "second" });

/**
 * Notion Export Pod (V2 - for compatibility with Pod V2 workflow).
 */
export class NotionExportPodV2 implements ExportPodV2<NotionExportReturnType> {
  private _config: RunnableNotionV2PodConfig;

  constructor({ podConfig }: { podConfig: RunnableNotionV2PodConfig }) {
    this._config = podConfig;
  }

  async exportNotes(notes: NoteProps[]): Promise<NotionExportReturnType> {
    const { parentPageId } = this._config;
    const { data, errors } = await this.createPagesInNotion(notes, parentPageId);
    const createdNotes = data.filter(
      (ent): ent is NotionFields => !_.isUndefined(ent)
    );

    if (errors.length > 0) {
      return {
        data: { created: createdNotes },
        error: new DendronCompositeError(errors),
      };
    } else {
      return ResponseUtil.createHappyResponse({
        data: {
          created: createdNotes,
        },
      });
    }
  }

  /**
   * Method to create pages in Notion
   */
  createPagesInNotion = async (
    notes: NoteProps[],
    parentPageId: string,
  ): Promise<{
    data: NotionFields[];
    errors: IDendronError[];
  }> => {
    const notion = new Client({
      auth: this._config.apiKey,
    });

    const keyMap = Object.fromEntries(
      notes.map(note => [
        note.parent ?? "undefined",
        note.parent ? new Deferred<string>() : new Deferred<string>(parentPageId)
      ])
    );

    const errors: IDendronError[] = [];
    const out: NotionFields[] = await asyncLoop(notes, async (note: NoteProps) => {
      const parentId = await keyMap[note.parent ?? "undefined"].promise;
      const blockPage = NotionExportPod.convertMdToNotionBlock(note, parentId);

      return asyncRetry(
        async () => {
          await limiter.removeTokens(1);
          const page = await notion.pages.create(blockPage);
          keyMap[note.id]?.resolve(page.id);
          return {
            notionId: page.id,
            dendronId: note.id,
          }
        },
        (error) => {
          keyMap[note.id]?.reject(`Failed to export the note title:'${note.title}' - id:${note.id}.`);
          errors.push(error as DendronError);
        });
    });

    return {
      data: out,
      errors,
    };
  };

  static config(): JSONSchemaType<NotionV2PodConfig> {
    return ConfigFileUtils.createExportConfig({
      required: ["connectionId", "parentPageId"],
      properties: {
        connectionId: {
          description: "ID of the Notion Connected Service",
          type: "string",
        },
        parentPageId: {
          description: "ID of parent page in notion",
          type: "string",
        },
      },
    }) as JSONSchemaType<NotionV2PodConfig>;
  }
}

export class NotionUtils {
  static updateNotionIdForNewlyCreatedNotes = async (
    records: NotionFields[],
    engine: DEngineClient
  ) => {
    await Promise.all(
      records.map(async (record) => {
        if (_.isUndefined(record)) return;
        const { notionId, dendronId } = record;
        if (!dendronId) return;
        const resp = await engine.getNote(dendronId);
        if (resp.data) {
          const note = resp.data;
          note.custom = {
            ...note.custom,
            notionId,
          };
          await engine.writeNote(note, { metaOnly: true });
        }
      })
    );
  };
}
