import {
  ConfigUtils,
  DendronConfig,
  NoteProps,
  NoteUtils,
  Position,
  position2VSCodeRange,
  ReducedDEngine,
} from "@dendronhq/common-all";
import { HashTag } from "../types";
import { Decorator } from "./utils";
import { DecorationWikilink, linkedNoteType } from "./wikilinks";

export type DecorationHashTag = DecorationWikilink & {
  color?: string;
};

export function isDecorationHashTag(
  decoration: DecorationWikilink
): decoration is DecorationHashTag {
  return (decoration as DecorationHashTag).color !== undefined;
}

export const decorateHashTag: Decorator<HashTag, DecorationHashTag> = (
  opts
) => {
  const { node: hashtag, engine, config, note } = opts;
  const { position } = hashtag;
  return decorateTag({
    fname: hashtag.fname,
    engine,
    position,
    config,
    note,
  });
};

export async function decorateTag({
  fname,
  engine,
  position,
  lineOffset,
  config,
  note,
}: {
  fname: string;
  engine: ReducedDEngine;
  position: Position;
  lineOffset?: number;
  config: DendronConfig;
  note?: NoteProps;
}) {
  let color: string | undefined;
  const { color: foundColor, type: colorType } = NoteUtils.color({
    fname,
    note,
    // engine,
  });
  const enableRandomlyColoredTags =
    ConfigUtils.getPublishing(config).enableRandomlyColoredTags;
  if (colorType === "configured" || enableRandomlyColoredTags) {
    color = foundColor;
  }

  const { type, errors } = await linkedNoteType({
    fname,
    engine,
    vaults: config.workspace?.vaults ?? [],
  });
  const decoration: DecorationHashTag = {
    type,
    range: position2VSCodeRange(position, { line: lineOffset }),
    color,
  };

  return { errors, decorations: [decoration] };
}
