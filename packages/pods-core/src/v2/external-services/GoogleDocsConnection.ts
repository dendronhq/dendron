import { JSONSchemaType } from "ajv";
import { ExternalService, ExternalTarget } from "./ExternalConnectionManager";

/**
 * Represents a unique service connection to Airtable.
 */
export class GoogleDocsConnection implements ExternalTarget {
  constructor(
    connectionId: string,
    accessToken: string,
    refreshToken: string,
    expirationTime: number
  ) {
    this._accessToken = accessToken;
    this._connectionId = connectionId;
    this._refreshToken = refreshToken;
    this._expirationTime = expirationTime;
  }
  serviceType: ExternalService = ExternalService.GoogleDocs;

  private _accessToken: string;
  private _refreshToken: string;
  private _connectionId: string;
  private _expirationTime: number;

  /**
   * personal access token for google services
   */
  public get accessToken() {
    return this._accessToken;
  }

  /**
   * personal refresh token for google services
   */
  public get refreshToken() {
    return this._refreshToken;
  }

  /**
   * A unique ID to represent this google connection
   */
  public get connectionId() {
    return this._connectionId;
  }

  public get expirationTime() {
    return this._expirationTime;
  }

  static getSchema(): JSONSchemaType<GoogleDocsConnection> {
    return {
      type: "object",
      required: ["connectionId", "serviceType", "accessToken", "refreshToken"],
      properties: {
        connectionId: {
          description: "configuration ID",
          type: "string",
        },
        serviceType: {
          type: "string",
          description: "Connection Type",
          default: ExternalService.GoogleDocs,
        },
        accessToken: {
          type: "string",
          description: "google docs personal access token",
        },
        refreshToken: {
          type: "string",
          description: "google docs personal refresh token",
        },
        expirationTime: {
          type: "number",
          description: "expiration time of access token",
        },
      },
    };
  }
}
