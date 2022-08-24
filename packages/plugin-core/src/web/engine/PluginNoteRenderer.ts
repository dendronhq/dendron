import {
  RenderNoteOpts,
  RespV2,
  RenderNotePayload,
  DendronASTDest,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  DendronPublishingConfig,
  ResponseUtil,
  DendronError,
  VaultUtils,
  StrictConfigV5,
} from "@dendronhq/common-all";
import {
  MDUtilsV5,
  MDUtilsV5Web,
  ProcDataFullOptsV5,
} from "@dendronhq/unified";
import { inject, injectable } from "tsyringe";
import { INoteRenderer } from "./INoteRenderer";

@injectable()
export class PluginNoteRenderer implements INoteRenderer {
  constructor(
    @inject("PublishingConfig")
    private publishingConfig: StrictConfigV5 // private publishingConfig: DendronPublishingConfig
  ) {}

  async renderNote(opts: RenderNoteOpts): Promise<RespV2<RenderNotePayload>> {
    try {
      const data = await this._renderNote({
        note: opts.note!, // TODO: get rid of !
        flavor: opts.flavor || ProcFlavor.PREVIEW,
        dest: opts.dest || DendronASTDest.HTML,
      });

      return ResponseUtil.createHappyResponse({ data });
    } catch (error) {
      return ResponseUtil.createUnhappyResponse({
        error: new DendronError({
          message: `Unable to render note ${
            opts.note!.fname
          } in ${VaultUtils.getName(opts.note!.vault)}`,
          payload: error,
        }),
      });
    }
  }

  private async _renderNote({
    note,
    flavor,
    dest,
  }: {
    note: NoteProps;
    flavor: ProcFlavor;
    dest: DendronASTDest;
  }): Promise<string> {
    let proc: ReturnType<typeof MDUtilsV5["procRehypeFull"]>;
    if (dest === DendronASTDest.HTML) {
      proc = MDUtilsV5Web.procRehypeWeb(
        {
          // engine: this,
          noteToRender: note,
          fname: note.fname,
          vault: note.vault,
          config: this.publishingConfig,
        } as ProcDataFullOptsV5, // TODO: we need this cast to avoid sending in engine temporarily.
        { flavor }
      );
    } else {
      // Only support Preview rendering right now:
      return "Unable to Perform Render";
      // proc = MDUtilsV5.procRemarkFull(
      //   {
      //     engine: this,
      //     fname: note.fname,
      //     vault: note.vault,
      //     dest,
      //   },
      //   { flavor }
      // );
    }
    const serialized = NoteUtils.serialize(note);
    const payload = await proc.process(serialized);
    const renderedNote = payload.toString();
    return renderedNote;
  }
}
