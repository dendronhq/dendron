import {
  DEngine,
  NoteUtils,
  Position,
  position2VSCodeRange,
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
  const { node: hashtag, engine } = opts;
  const { position } = hashtag;
  return decorateTag({
    fname: hashtag.fname,
    engine,
    position,
  });
};

export async function decorateTag({
  fname,
  engine,
  position,
  lineOffset,
}: {
  fname: string;
  engine: DEngine;
  position: Position;
  lineOffset?: number;
}) {
  let color: string | undefined;
  const { color: foundColor, type: colorType } = NoteUtils.color({
    fname,
    engine,
  });
  if (colorType === "configured" || !engine.config.noRandomlyColoredTags) {
    color = foundColor;
  }

  const { type, errors } = await linkedNoteType({ fname, engine });
  const decoration: DecorationHashTag = {
    type,
    range: position2VSCodeRange(position, { line: lineOffset }),
    color,
  };

  return { errors, decorations: [decoration] };
}
