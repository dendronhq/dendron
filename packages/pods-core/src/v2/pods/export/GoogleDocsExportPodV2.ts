import {
  axios,
  DendronError,
  DEngineClient,
  DVault,
  NoteProps,
  ResponseUtil,
  RespV2,
  stringifyError,
  Time,
} from "@dendronhq/common-all";
import { DendronASTDest, MDUtilsV4, MDUtilsV5 } from "@dendronhq/engine-server";
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
  /**
   * Revision Id of the exported Note
   */
  revisionId?: string;
}>;

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
    const documentId = input.custom.documentId;

    const response = await this.exportToGDoc({
      data,
      name: input.fname,
      documentId,
    });
    return response;
  }

  async exportText(_input: string): Promise<GoogleDocsExportReturnType> {
    const proc = MDUtilsV5.procRemarkParseNoData(
      {},
      { dest: DendronASTDest.HTML }
    );
    const out = await MDUtilsV4.procRehype({
      proc,
      mathjax: true,
    }).process(_input);
    const data = `<html>${out.contents}</html>`;
    const response = await this.exportToGDoc({
      data,
      name: "Untitled document",
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
    try {
      //checks the expiration time of the access token and refreshes if already expired.
      if (Time.now().toSeconds() > expirationTime) {
        accessToken = await PodUtils.refreshGoogleAccessToken(
          this._wsRoot,
          refreshToken,
          this._config.connectionId
        );
      }
    } catch (err: any) {
      throw new DendronError({ message: stringifyError(err) });
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
      return ResponseUtil.createHappyResponse({
        data: {
          documentId: response.data.id,
          revisionId,
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
    let revisionId = "";
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
      if (response) {
        revisionId = await this.getRevisionId({ documentId, accessToken });
      }
      return ResponseUtil.createHappyResponse({
        data: {
          documentId: response.data.id,
          revisionId,
        },
      });
    } catch (err: any) {
      return ResponseUtil.createUnhappyResponse({
        error: err as DendronError,
      });
    }
  }

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
      return ResponseUtil.createUnhappyResponse({
        error: err as DendronError,
      });
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
