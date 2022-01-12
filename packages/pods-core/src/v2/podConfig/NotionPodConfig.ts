import { JSONSchemaType } from "ajv";
import { ExternalTarget } from "../external-services/ExternalConnectionManager";
import { NotionConnection } from "../external-services/NotionConnection";
import { ExportPodConfigurationV2 } from "./PodV2Types";

/**
 * Complete Pod Config for Notion V2
 */
export type NotionV2PodConfig = ExportPodConfigurationV2 & {
  parentPageId: string;
};

/**
 * This is the persisted version of the config that gets serialized into a YAML
 * file. It must contain a reference to an notion connection ID.
 */
export type PersistedNotionPodConfig = NotionV2PodConfig &
  Pick<ExternalTarget, "connectionId">;

/**
 * This is the set of parameters required for actual execution of the Pod
 */
export type RunnableNotionV2PodConfig = Omit<
  NotionV2PodConfig,
  "podId" | "podType"
> &
  Pick<NotionConnection, "apiKey">;

/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link RunnableNotionV2PodConfig}
 * @param object
 * @returns
 */
export function isRunnableNotionV2PodConfig(object: any) {
  return (
    object !== undefined &&
    "apiKey" in object &&
    "exportScope" in object &&
    "parentPageId" in object
  );
}

export function createRunnableNotionV2PodConfigSchema(): JSONSchemaType<RunnableNotionV2PodConfig> {
  return {
    type: "object",
    required: ["apiKey", "exportScope", "parentPageId"],
    properties: {
      apiKey: {
        type: "string",
      },
      exportScope: {
        type: "string",
      },
      parentPageId: {
        type: "string",
      },
      description: {
        type: "string",
        nullable: true,
      },
    },
  };
}
