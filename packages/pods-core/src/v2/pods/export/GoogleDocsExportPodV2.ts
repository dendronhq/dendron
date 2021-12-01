import {
  axios,
  DendronError,
  DEngineClient,
  DVault,
  NoteProps,
  ResponseUtil,
  RespV2,
  Time,
} from "@dendronhq/common-all";
import { JSONSchemaType } from "ajv";
import FormData from "form-data";
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
  /**
   * Document Id of the exported Note
   */
  documentId?: string;
}>;

/**
 * GDoc Export Pod (V2 - for compatibility with Pod V2 workflow). Supports
 *exportNote()
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
    const pod = new HTMLPublishPod();
    const config = {
      fname: input.fname,
      vaultName: input.vault,
      dest: "stdout",
      convertWikilinksToHref: false,
    };
    // converts markdown to html using HTMLPublish pod. The Drive API supports converting MIME types while creating a file.
    const data = await pod.plant({
      config,
      engine: this._engine,
      note: input,
      vaults: this._vaults,
      wsRoot: this._wsRoot,
    });
    const documentId = input.custom.documentId;

    const response = await this.exportToGDoc({
      data,
      name: input.fname,
      documentId,
    });
    return response;
  }

  /**
   * creates a new google document with the contents of a note
   */
  async exportToGDoc(opts: {
    data: string;
    name: string;
    documentId?: string;
  }): Promise<GoogleDocsExportReturnType> {
    const { data, name, documentId } = opts;
    const { refreshToken, expirationTime } = this._config;
    let { accessToken } = this._config;

    //checks the expiration time of the access token and refreshes if already expired.
    if (Time.now().toSeconds() > expirationTime) {
      accessToken = await PodUtils.refreshGoogleAccessToken(
        this._wsRoot,
        refreshToken,
        this._config.connectionId
      );
    }
    const content = Buffer.from(data);

    if (_.isUndefined(documentId)) {
      return this.createGdoc({ content, name, accessToken });
    } else {
      return this.overwriteGdoc({ content, accessToken, documentId });
    }
  }

  /**
   * Create a new gdoc
   */
  async createGdoc(opts: {
    content: Buffer;
    name: string;
    accessToken: string;
  }): Promise<GoogleDocsExportReturnType> {
    try {
      const { content, name, accessToken } = opts;
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
      return ResponseUtil.createHappyResponse({
        data: {
          documentId: response.data.id,
        },
      });
    } catch (err: any) {
      return ResponseUtil.createUnhappyResponse({
        error: err as DendronError,
      });
    }
  }

  /**
   * If a note has document id, overwrite the existing gdoc with the note's content.
   * @param opts
   * @returns
   */
  async overwriteGdoc(opts: {
    content: Buffer;
    accessToken: string;
    documentId: string;
  }): Promise<GoogleDocsExportReturnType> {
    const { content, accessToken, documentId } = opts;
    const fileSize = content.length;
    try {
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
      return ResponseUtil.createHappyResponse({
        data: {
          documentId: response.data.id,
        },
      });
    } catch (err: any) {
      return ResponseUtil.createUnhappyResponse({
        error: err as DendronError,
      });
    }
  }

  static config(): JSONSchemaType<GoogleDocsV2PodConfig> {
    return ConfigFileUtils.createExportConfig({
      required: [],
      properties: {},
    }) as JSONSchemaType<GoogleDocsV2PodConfig>;
  }
}
