import { JSONSchemaType } from "ajv";
import { ExternalTarget } from "../external-services/ExternalConnectionManager";
import { GoogleDocsConnection } from "../external-services/GoogleDocsConnection";
import { ExportPodConfigurationV2 } from "./PodV2Types";

/**
 * Complete Pod Config for Google Docs V2
 */
export type GoogleDocsV2PodConfig = ExportPodConfigurationV2 & {
  parentFolderId?: string;
};
/**
 * This is the persisted version of the config that gets serialized into a YAML
 * file. It must contain a reference to a google service connection ID.
 */
export type PersistedGoogleDocsPodConfig = GoogleDocsV2PodConfig &
  Pick<ExternalTarget, "connectionId">;

/**
 * This is the set of parameters required for actual execution of the Pod
 */
export type RunnableGoogleDocsV2PodConfig = Omit<
  GoogleDocsV2PodConfig,
  "podId" | "podType" | "description"
> &
  Pick<
    GoogleDocsConnection,
    "accessToken" | "refreshToken" | "expirationTime" | "connectionId"
  >;

/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link RunnableGoogleDocsV2PodConfig}
 * @param object
 * @returns
 */
export function isRunnableGoogleDocsV2PodConfig(
  object: RunnableGoogleDocsV2PodConfig
) {
  return (
    object !== undefined &&
    object.accessToken &&
    object.refreshToken &&
    object.expirationTime &&
    object.exportScope &&
    object.connectionId
  );
}

export function createRunnableGoogleDocsV2PodConfigSchema(): JSONSchemaType<RunnableGoogleDocsV2PodConfig> {
  return {
    type: "object",
    required: [
      "accessToken",
      "refreshToken",
      "expirationTime",
      "exportScope",
      "connectionId",
    ],
    properties: {
      accessToken: {
        type: "string",
      },
      refreshToken: {
        type: "string",
      },
      expirationTime: {
        type: "number",
      },
      connectionId: {
        type: "string",
      },
      exportScope: {
        type: "string",
      },
      parentFolderId: {
        type: "string",
        nullable: true,
      },
    },
  };
}
