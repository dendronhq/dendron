import {
  axios,
  DendronCompositeError,
  DendronError,
  DEngineClient,
  DVault,
  IDendronError,
  NoteProps,
  ResponseUtil,
  RespV2,
  stringifyError,
  Time,
} from "@dendronhq/common-all";
import { JSONSchemaType } from "ajv";
import FormData from "form-data";
import { RateLimiter } from "limiter";
import _ from "lodash";
import {
  ConfigFileUtils,
  ExportPodV2,
  GoogleDocsV2PodConfig,
  HTMLPublishPod,
  PodUtils,
  RunnableGoogleDocsV2PodConfig,
} from "../../..";

export type GoogleDocsExportReturnType = RespV2<{
  created?: GoogleDocsFields[];
  updated?: GoogleDocsFields[];
}>;

export type GoogleDocsFields =
  | {
      /**
       * Document Id of the exported Note
       */
      documentId?: string;
      /**
       * Revision Id of the exported Note
       */
      revisionId?: string;
      /**
       * id of note
       */
      dendronId?: string;
    }
  | undefined;

type GoogleDocsPayload = {
  content: Buffer;
  documentId?: string;
  name: string;
  dendronId: string;
};
/**
 * GDoc Export Pod (V2 - for compatibility with Pod V2 workflow). Supports only
 * exportNote() for now
 */
export class GoogleDocsExportPodV2
  implements ExportPodV2<GoogleDocsExportReturnType>
{
  private _config: RunnableGoogleDocsV2PodConfig;
  private _engine: DEngineClient;
  private _wsRoot: string;
  private _vaults: DVault[];

  constructor({
    podConfig,
    engine,
    vaults,
    wsRoot,
  }: {
    podConfig: RunnableGoogleDocsV2PodConfig;
    engine: DEngineClient;
    vaults: DVault[];
    wsRoot: string;
  }) {
    this._config = podConfig;
    this._engine = engine;
    this._vaults = vaults;
    this._wsRoot = wsRoot;
  }

  async exportNote(input: NoteProps): Promise<GoogleDocsExportReturnType> {
    const response = await this.exportNotes([input]);
    return response;
  }

  async exportNotes(notes: NoteProps[]): Promise<GoogleDocsExportReturnType> {
    const resp = await this.getPayloadForNotes(notes);
    let { accessToken, expirationTime, refreshToken } = this._config;
    try {
      accessToken = await this.checkTokenExpiry(
        expirationTime,
        accessToken,
        refreshToken
      );
    } catch (err: any) {
      return {
        data: {},
        error: err as DendronError,
      };
    }
    /**
     * The rate of Drive API write requests is limited—avoid exceeding 3 requests per second
     * of sustained write or insert requests
     */
    const limiter = new RateLimiter({
      tokensPerInterval: 3,
      interval: "second",
    });
    const docToCreate = resp.filter((note) => _.isUndefined(note.documentId));
    const docToUpdate = resp.filter((note) => !_.isUndefined(note.documentId));

    const createRequest = await this.createGdoc({
      docToCreate,
      accessToken,
      limiter,
    });
    const updateRequest = await this.overwriteGdoc({
      docToUpdate,
      accessToken,
      limiter,
    });
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
   * Method to check if the accessToken is valid, if not returns a refreshed accessToken
   */
  private async checkTokenExpiry(
    expirationTime: number,
    accessToken: string,
    refreshToken: string
  ) {
    if (Time.now().toSeconds() > expirationTime) {
      accessToken = await PodUtils.refreshGoogleAccessToken(
        this._wsRoot,
        refreshToken,
        this._config.connectionId
      );
    }
    return accessToken;
  }

  /**
   * Method to return the payload for creating/overwriting a google document.
   * @param notes
   * @returns an array of payload for each note.
   */
  getPayloadForNotes(notes: NoteProps[]): Promise<GoogleDocsPayload[]> {
    return Promise.all(
      notes.map(async (input) => {
        const pod = new HTMLPublishPod();
        const config = {
          fname: input.fname,
          vaultName: input.vault,
          dest: "stdout",
          convertLinks: false,
        };
        // converts markdown to html using HTMLPublish pod. The Drive API supports converting MIME types while creating a file.
        const data = await pod.plant({
          config,
          engine: this._engine,
          note: input,
          vaults: this._vaults,
          wsRoot: this._wsRoot,
        });
        const content = Buffer.from(data);
        const documentId = input.custom.documentId;
        return {
          content,
          documentId,
          name: input.fname,
          dendronId: input.id,
        };
      })
    );
  }

  /**
   * Creates new google documents for given notes.
   */
  async createGdoc(opts: {
    docToCreate: GoogleDocsPayload[];
    accessToken: string;
    limiter?: RateLimiter;
  }): Promise<{ data: GoogleDocsFields[]; errors: IDendronError[] }> {
    const { docToCreate, accessToken, limiter } = opts;
    const errors: IDendronError[] = [];
    const out: GoogleDocsFields[] = await Promise.all(
      docToCreate.map(async ({ name, content, dendronId }) => {
        await limiter?.removeTokens(1);
        try {
          let revisionId = "";
          //metadata is used by drive API to understand the required MIME type
          const metadata = {
            name,
            mimeType: "application/vnd.google-apps.document",
            parents: ["root"],
          };
          const formData = new FormData();
          formData.append("metadata", JSON.stringify(metadata), {
            contentType: "application/json",
          });
          formData.append("file", content);
          const response = await axios({
            method: "POST",
            url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": `multipart/related; boundary=${formData.getBoundary()}`,
            },
            data: formData,
          });
          if (response) {
            revisionId = await this.getRevisionId({
              documentId: response.data.id,
              accessToken,
            });
          }
          return {
            documentId: response.data.id,
            revisionId,
            dendronId,
          };
        } catch (err: any) {
          errors.push(err as DendronError);
          return;
        }
      })
    );
    return {
      data: out,
      errors,
    };
  }

  /**
   * If a note has document id, overwrite the existing gdoc with the note's content.
   * @param opts
   * @returns
   */
  async overwriteGdoc(opts: {
    docToUpdate: GoogleDocsPayload[];
    accessToken: string;
    limiter: RateLimiter;
  }) {
    const { docToUpdate, accessToken, limiter } = opts;
    const errors: IDendronError[] = [];
    const out: GoogleDocsFields[] = await Promise.all(
      docToUpdate.map(async ({ content, documentId, dendronId }) => {
        if (!documentId) return;
        await limiter.removeTokens(1);
        try {
          const fileSize = content.length;
          let revisionId = "";
          const response = await axios({
            method: "PUT",
            url: `https://www.googleapis.com/upload/drive/v2/files/${documentId}`,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`,
            },
            data: content,
          });
          if (response) {
            revisionId = await this.getRevisionId({ documentId, accessToken });
          }
          return {
            documentId: response.data.id,
            revisionId,
            dendronId,
          };
        } catch (err: any) {
          errors.push(err as DendronError);
          return;
        }
      })
    );
    return {
      data: out,
      errors,
    };
  }

  /**
   * Method to retrieve revisionId of a document. The drive api only returns document id in response.
   */
  async getRevisionId(opts: { accessToken: string; documentId: string }) {
    const { accessToken, documentId } = opts;
    try {
      const result = await axios.get(
        `https://docs.googleapis.com/v1/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return result.data.revisionId;
    } catch (err: any) {
      throw new DendronError({ message: stringifyError(err) });
    }
  }

  static config(): JSONSchemaType<GoogleDocsV2PodConfig> {
    return ConfigFileUtils.createExportConfig({
      required: ["connectionId"],
      properties: {
        connectionId: {
          description: "ID of the Airtable Connected Service",
          type: "string",
        },
      },
    }) as JSONSchemaType<GoogleDocsV2PodConfig>;
  }
}
