import {
  RenderNoteOpts,
  RespV2,
  RenderNotePayload,
} from "@dendronhq/common-all";

/**
 * Extracted from DEngine
 */
export interface INoteRenderer {
  renderNote(opts: RenderNoteOpts): Promise<RespV2<RenderNotePayload>>;
}
