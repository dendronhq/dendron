import { RenderNoteOpts, RenderNoteResp } from "@dendronhq/common-all";

/**
 * Extracted from DEngine
 */
export interface INoteRenderer {
  renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp>;
}
