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
 * both exportText() and exportNote()
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
    };
    // converts markdown to html using HTMLPublish pod. The Drive API supports converting MIME types while creating a file.
    const data = await pod.plant({
      config,
      engine: this._engine,
      note: input,
      vaults: this._vaults,
      wsRoot: this._wsRoot,
    });
    const response = await this.exportToGDoc({ data, name: input.title });
    return response;
  }

  /**
   * creates a new google document with the contents of a note
   */
  async exportToGDoc(opts: {
    data: string;
    name: string;
  }): Promise<GoogleDocsExportReturnType> {
    const { data, name } = opts;
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

    try {
      const content = Buffer.from(data);
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

  static config(): JSONSchemaType<GoogleDocsV2PodConfig> {
    return ConfigFileUtils.createExportConfig({
      required: [],
      properties: {},
    }) as JSONSchemaType<GoogleDocsV2PodConfig>;
  }
}
