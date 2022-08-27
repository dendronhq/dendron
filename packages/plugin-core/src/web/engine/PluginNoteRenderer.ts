import {
  RenderNoteOpts,
  RespV2,
  RenderNotePayload,
  DendronASTDest,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  ResponseUtil,
  DendronError,
  VaultUtils,
  StrictConfigV5,
  ReducedDEngine,
} from "@dendronhq/common-all";
import {
  DendronASTTypes,
  MDUtilsV5,
  MDUtilsV5Web,
  NoteRefNoteV4,
  ProcDataFullOptsV5,
  WikiLinkNoteV4,
} from "@dendronhq/unified";
import { inject, injectable } from "tsyringe";
import { INoteRenderer } from "./INoteRenderer";
import visit from "unist-util-visit";
import _ from "lodash";

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

    type notePK = {
      fname: string;
      vaultName?: string;
    };

    const renderDependencies: notePK[] = [];

    visit(
      ast,
      [DendronASTTypes.WIKI_LINK],
      (wikilink: WikiLinkNoteV4, _index) => {
        renderDependencies.push({
          fname: wikilink.value,
          vaultName: wikilink.data.vaultName,
        });
        console.log(`Found wikilink in note ${note.fname}: ${wikilink.value}`);
      }
    );

    // TODO: recursively do ref_link data gathering in case there are nested note refs.
    visit(
      ast,
      [DendronASTTypes.REF_LINK_V2],
      (noteRef: NoteRefNoteV4, _index) => {
        renderDependencies.push({
          fname: noteRef.value,
          vaultName: noteRef.data.vaultName,
        });
        console.log(`Found note ref in note ${note.fname}: ${noteRef.value}`);
      }
    );
    // TODO: Do the same with user tags and hash tags

    // TODO: Dedupe renderDependencies first
    let allData: NoteProps[] = await Promise.all(
      renderDependencies.map(async (note) => {
        const notes = await this.engine.findNotes({ fname: note.fname }); // TODO: Add vault information
        return notes[0];
      })
    );

    await Promise.all(
      note.children.map(async (childId) => {
        const childNote = await this.engine.getNote(childId); // TODO: use Bulk get API instead

        if (childNote.data) {
          allData.push(childNote.data);
        }
      })
    );

    allData = _.compact(allData);

    const secondProc = MDUtilsV5Web.procRehypeWeb(
      {
        // engine: this,
        noteToRender: note,
        noteCacheForRender: allData,
        fname: note.fname,
        vault: note.vault,
        config: this.publishingConfig,
      } as ProcDataFullOptsV5, // TODO: we need this cast to avoid sending in engine temporarily.
      { flavor }
    );

    const payload = await secondProc.process(serialized);

    const renderedNote = payload.toString();
    return renderedNote;
  }
}
