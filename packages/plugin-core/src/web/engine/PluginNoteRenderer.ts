import {
  DendronASTDest,
  DendronError,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  ReducedDEngine,
  RenderNoteOpts,
  RenderNotePayload,
  ResponseUtil,
  RespV2,
  StrictConfigV5,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  getNoteDependencies,
  MDUtilsV5,
  MDUtilsV5Web,
  ProcDataFullOptsV5,
} from "@dendronhq/unified";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import { INoteRenderer } from "./INoteRenderer";

@injectable()
export class PluginNoteRenderer implements INoteRenderer {
  constructor(
    @inject("PublishingConfig")
    private publishingConfig: StrictConfigV5,
    @inject("ReducedDEngine") private engine: ReducedDEngine // private publishingConfig: DendronPublishingConfig
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
      return "Only HTML Rendering is supported right now.";
    }
    const serialized = NoteUtils.serialize(note);

    const ast = proc.parse(serialized);

    const renderDependencies = getNoteDependencies(ast);

    let allData: NoteProps[] = await Promise.all(
      renderDependencies.map(async (note) => {
        const notes = await this.engine.findNotes({ fname: note.fname }); // TODO: Add vault information
        return notes[0];
      })
    );

    // Also include children to render the 'children' hierarchy at the footer of the page:
    await Promise.all(
      note.children.map(async (childId) => {
        const childNote = await this.engine.getNote(childId); // TODO: use Bulk get API instead

        if (childNote.data) {
          allData.push(childNote.data);
        }
      })
    );

    allData = _.compact(allData);

    const secondProc = proc();
    MDUtilsV5.setProcData(secondProc, { noteCacheForRender: allData });
    // const secondProc = MDUtilsV5Web.procRehypeWeb(
    //   {
    //     // engine: this,
    //     noteToRender: note,
    //     noteCacheForRender: allData,
    //     fname: note.fname,
    //     vault: note.vault,
    //     config: this.publishingConfig,
    //   } as ProcDataFullOptsV5, // TODO: we need this cast to avoid sending in engine temporarily.
    //   { flavor }
    // );

    const payload = await secondProc.process(serialized);

    const renderedNote = payload.toString();
    return renderedNote;
  }
}
