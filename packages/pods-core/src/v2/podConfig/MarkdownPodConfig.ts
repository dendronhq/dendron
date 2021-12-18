import { JSONSchemaType } from "ajv";
import { ExportPodConfigurationV2 } from "./PodV2Types";

/**
 * Complete Pod Config for Markdown Export V2
 */
export type MarkdownV2PodConfig = ExportPodConfigurationV2 & {
  wikiLinkToURL?: boolean;
  // TODO: `"clipboard" | string` is kind of meaningless; use a better way to
  // distinguish clipboard functionality.
  destination: string | "clipboard";
};

/**
 * Markdown V2 config that contains just the properties required for markdown
 * export command execution
 */
export type RunnableMarkdownV2PodConfig = Omit<
  MarkdownV2PodConfig,
  "podId" | "podType"
>;

/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link RunnableMarkdownV2PodConfig}
 * @param object
 * @returns
 */
export function isRunnableMarkdownV2PodConfig(
  object: any
): object is RunnableMarkdownV2PodConfig {
  return (
    object !== undefined && "destination" in object && "exportScope" in object
  );
}

/**
 *
 * @returns
 * creates an AJV schema for runnable config
 */
export function createRunnableMarkdownV2PodConfigSchema(): JSONSchemaType<RunnableMarkdownV2PodConfig> {
  return {
    type: "object",
    required: ["destination", "exportScope"],
    properties: {
      destination: {
        type: "string",
      },
      exportScope: {
        type: "string",
      },
      description: {
        type: "string",
        nullable: true,
      },
      wikiLinkToURL: {
        type: "boolean",
        nullable: true,
      },
    },
  };
}
