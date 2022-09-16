import {
  IntermediateDendronConfig,
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
  const { node: hashtag, engine, config } = opts;
  const { position } = hashtag;
  return decorateTag({
    fname: hashtag.fname,
    engine,
    position,
    config,
  });
};

export async function decorateTag({
  fname,
  engine,
  position,
  lineOffset,
  config,
}: {
  fname: string;
  engine: ReducedDEngine;
  position: Position;
  lineOffset?: number;
  config: IntermediateDendronConfig;
}) {
  let color: string | undefined;
  const { color: foundColor, type: colorType } = NoteUtils.color({
    fname,
    // engine,
  });
  if (colorType === "configured" || !config.noRandomlyColoredTags) {
    color = foundColor;
  }

  const { type, errors } = await linkedNoteType({
    fname,
    engine,
    vaults: config.workspace?.vaults ?? config.vaults ?? [],
  });
  const decoration: DecorationHashTag = {
    type,
    range: position2VSCodeRange(position, { line: lineOffset }),
    color,
  };

  return { errors, decorations: [decoration] };
}
