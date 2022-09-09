import {
  DendronASTDest,
  DendronError,
  DVault,
  IntermediateDendronConfig,
  NoteDictsUtils,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  ReducedDEngine,
  RenderNoteOpts,
  RenderNoteResp,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  getParsingDependencyDicts,
  MDUtilsV5,
  MDUtilsV5Web,
} from "@dendronhq/unified";
import { inject, injectable } from "tsyringe";
import { INoteRenderer } from "./INoteRenderer";

@injectable()
export class PluginNoteRenderer implements INoteRenderer {
  // TODO: Remove this config from injection in favor of only injecting the
  // parameters that are needed. Right now, the unified proc's require the
  // entire config to be passed in.
  constructor(
    @inject("IntermediateDendronConfig")
    private publishingConfig: IntermediateDendronConfig,
    @inject("ReducedDEngine") private engine: ReducedDEngine,
    @inject("vaults") private vaults: DVault[]
  ) {}

  async renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp> {
    try {
      const data = await this._renderNote({
        note: opts.note!, // TODO: get rid of !
        flavor: opts.flavor || ProcFlavor.PREVIEW,
        dest: opts.dest || DendronASTDest.HTML,
      });

      return { data };
    } catch (error) {
      return {
        error: new DendronError({
          message: `Unable to render note ${
            opts.note!.fname
          } in ${VaultUtils.getName(opts.note!.vault)}`,
          payload: error,
        }),
      };
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
    const noteCacheForRenderDict = await getParsingDependencyDicts(
      note,
      this.engine,
      this.publishingConfig,
      this.vaults
    );

    // Also include children to render the 'children' hierarchy at the footer of the page:
    await Promise.all(
      note.children.map(async (childId) => {
        // TODO: Can we use a bulk get API instead (if/when it exists) to speed
        // up fetching time
        const childNote = await this.engine.getNote(childId);

        if (childNote.data) {
          NoteDictsUtils.add(childNote.data, noteCacheForRenderDict);
        }
      })
    );

    let proc: ReturnType<typeof MDUtilsV5["procRehypeFull"]>;
    if (dest === DendronASTDest.HTML) {
      proc = MDUtilsV5Web.procRehypeWeb(
        {
          noteToRender: note,
          fname: note.fname,
          vault: note.vault,
          config: this.publishingConfig,
          noteCacheForRenderDict,
        },
        { flavor }
      );
    } else {
      // Only support Preview rendering right now:
      return "Only HTML Rendering is supported right now.";
    }

    const serialized = NoteUtils.serialize(note);
    const payload = await proc.process(serialized);

    const renderedNote = payload.toString();
    return renderedNote;
  }
}
