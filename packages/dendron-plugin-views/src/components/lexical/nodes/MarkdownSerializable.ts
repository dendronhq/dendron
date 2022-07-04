/**
 * Serialize to a markdown string.
 */
export interface MarkdownSerializable {
  serialize(): string;
}

export function isMarkdownSerializable(
  object: any
): object is MarkdownSerializable {
  return (object as MarkdownSerializable).serialize !== undefined;
}
