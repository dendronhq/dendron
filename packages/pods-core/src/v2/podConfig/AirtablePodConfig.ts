import { JSONSchemaType } from "ajv";
import { SrcFieldMapping } from "../../builtin/AirtablePod";
import { AirtableConnection } from "../external-services/AirtableConnection";
import { ExternalTarget } from "../external-services/ExternalConnectionManager";
import { ExportPodConfigurationV2 } from "./PodV2Types";

/**
 * Complete Pod Config for Airtable V2
 */
export type AirtableV2PodConfig = ExportPodConfigurationV2 & {
  baseId: string;
  tableName: string;
  sourceFieldMapping: { [key: string]: SrcFieldMapping };
};

/**
 * This is the persisted version of the config that gets serialized into a YAML
 * file. It must contain a reference to an airtable connection ID.
 */
export type PersistedAirtablePodConfig = AirtableV2PodConfig &
  Pick<ExternalTarget, "connectionId">;

/**
 * This is the set of parameters required for actual execution of the Pod
 */
export type RunnableAirtableV2PodConfig = Omit<
  AirtableV2PodConfig,
  "podId" | "podType"
> &
  Pick<AirtableConnection, "apiKey">;

/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link RunnableAirtableV2PodConfig}
 * @param object
 * @returns
 */
export function isRunnableAirtableV2PodConfig(
  object: any
): object is RunnableAirtableV2PodConfig {
  return (
    object !== undefined &&
    "apiKey" in object &&
    "baseId" in object &&
    "tableName" in object &&
    "sourceFieldMapping" in object &&
    object["sourceFieldMapping"] &&
    "exportScope" in object
  );
}

export function createRunnableAirtableV2PodConfigSchema(): JSONSchemaType<RunnableAirtableV2PodConfig> {
  return {
    type: "object",
    required: [
      "apiKey",
      "baseId",
      "tableName",
      "sourceFieldMapping",
      "exportScope",
    ],
    properties: {
      apiKey: {
        type: "string",
      },
      baseId: {
        type: "string",
      },
      tableName: {
        type: "string",
      },
      sourceFieldMapping: {
        type: "object",
        required: [],
      },
      exportScope: {
        type: "string",
      },
      description: {
        type: "string",
        nullable: true,
      },
    },
  };
}
