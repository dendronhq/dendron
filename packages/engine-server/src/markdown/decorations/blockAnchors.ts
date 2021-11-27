import { position2VSCodeRange } from "@dendronhq/common-all";
import { BlockAnchor } from "../types";
import { Decoration, DECORATION_TYPES, Decorator } from "./utils";

export type DecorationBlockAnchor = Decoration & {
  type: DECORATION_TYPES.blockAnchor;
};

export const decorateBlockAnchor: Decorator<
  BlockAnchor,
  DecorationBlockAnchor
> = (opts) => {
  const { node: blockAnchor } = opts;
  const { position } = blockAnchor;

  const decoration: DecorationBlockAnchor = {
    type: DECORATION_TYPES.blockAnchor,
    range: position2VSCodeRange(position),
  };
  return {
    decorations: [decoration],
    errors: [],
  };
};
