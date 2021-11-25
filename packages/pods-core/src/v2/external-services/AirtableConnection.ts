import { JSONSchemaType } from "ajv";
import { ExternalService, ExternalTarget } from "./ExternalConnectionManager";

/**
 * Represents a unique service connection to Airtable.
 */
export class AirtableConnection implements ExternalTarget {
  constructor(connectionId: string, apiKey: string) {
    this._apiKey = apiKey;
    this._connectionId = connectionId;
  }
  serviceType: ExternalService = ExternalService.Airtable;

  private _apiKey: string;
  private _connectionId: string;

  /**
   * API Key to connect to airtable.  See
   * https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-
   */
  public get apiKey() {
    return this._apiKey;
  }

  /**
   * A unique ID to represent this airtable connection
   */
  public get connectionId() {
    return this._connectionId;
  }

  static getSchema(): JSONSchemaType<AirtableConnection> {
    return {
      type: "object",
      required: ["connectionId", "serviceType", "apiKey"],
      properties: {
        connectionId: {
          description: "configuration ID",
          type: "string",
        },
        serviceType: {
          type: "string",
          description: "Connection Type",
          default: ExternalService.Airtable,
        },
        apiKey: { type: "string", description: "API Key to access Airtable" },
      },
    };
  }
}
