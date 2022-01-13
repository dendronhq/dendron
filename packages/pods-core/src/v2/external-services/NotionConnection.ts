import { JSONSchemaType } from "ajv";
import { ExternalService, ExternalTarget } from "./ExternalConnectionManager";

/**
 * Represents a unique service connection to Notion.
 */
export class NotionConnection implements ExternalTarget {
  constructor(connectionId: string, apiKey: string) {
    this._apiKey = apiKey;
    this._connectionId = connectionId;
  }
  serviceType: ExternalService = ExternalService.Notion;

  private _apiKey: string;
  private _connectionId: string;

  /**
   * API Key to connect to Notion.  See
   * [[Authentication|dendron://dendron.dendron-site/dendron.topic.pod.builtin.notion#authentication]]
   */
  public get apiKey() {
    return this._apiKey;
  }

  /**
   * A unique ID to represent this Notion connection
   */
  public get connectionId() {
    return this._connectionId;
  }

  static getSchema(): JSONSchemaType<NotionConnection> {
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
          default: ExternalService.Notion,
        },
        apiKey: { type: "string", description: "API Key to access Notion" },
      },
    };
  }
}
