import { DEngineClient, NoteProps, NotePropsDict, NoteUtils, stringifyError } from "@dendronhq/common-all";
import { MDUtilsV5, ProcFlavor, SiteUtils } from "@dendronhq/engine-server";
import { JSONSchemaType } from "ajv";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ExportPod, ExportPodConfig, ExportPodPlantOpts } from "../basev3";
import { PodUtils } from "../utils";

const ID = "dendron.nextjs";

type NextjsExportPodCustomOpts = {};

export type NextjsExportConfig = ExportPodConfig & NextjsExportPodCustomOpts;

export class NextjsExportPod extends ExportPod<NextjsExportConfig> {
  static id: string = ID;
  static description: string = "export notes to Nextjs";

  get config(): JSONSchemaType<NextjsExportConfig> {
    return PodUtils.createExportConfig({
      required: [],
      properties: {},
    }) as JSONSchemaType<NextjsExportConfig>;
  }

  async _renderNote({engine, note, notes}: {engine: DEngineClient, note: NoteProps, notes: NotePropsDict}) {
    const proc = MDUtilsV5.procRehypeFull(
      {
        engine,
        fname: note.fname,
        vault: note.vault,
        config: engine.config,
        notes
      },
      { flavor: ProcFlavor.PUBLISHING }
    );
    const payload = await proc.process(NoteUtils.serialize(note));
    return payload.toString();

  }

  async renderToFile({engine, note, notesDir, notes}: Parameters<NextjsExportPod["_renderNote"]>[0] & {notesDir: string}) {
    const ctx = `${ID}:renderToFile`
    const out = await this._renderNote({engine, note, notes});
    const dst = path.join(notesDir, note.id + ".html")
    this.L.debug({ctx, dst, msg: "writeNote"});
    return fs.writeFile(dst, out)
  }

  async plant(opts: ExportPodPlantOpts) {
    const ctx = `${ID}:plant`
    const { dest, engine } = opts;

    const podDstDir = dest.fsPath;
    fs.ensureDirSync(podDstDir);

    this.L.info({ctx, msg: "filtering notes..."})
    const { notes: publishedNotes, domains } = await SiteUtils.filterByConfig({
      engine,
      config: engine.config,
    });
    const siteNotes = SiteUtils.addSiteOnlyNotes({
      engine,
    });
    _.forEach(siteNotes, (ent) => {
      publishedNotes[ent.id] = ent;
    });
    const noteIndex = _.find(domains, (ent) => ent.custom.permalink === "/");
    const payload = { notes: publishedNotes, domains, noteIndex };

    // render notes
    const notesDir = path.join(podDstDir, "notes");
    this.L.info({ctx, msg: "ensuring notesDir...", notesDir})
    fs.ensureDirSync(notesDir);
    this.L.info({ctx, msg: "writing notes..."})
    await Promise.all(_.values(publishedNotes).map(async note => {
      return this.renderToFile({engine, note, notesDir, notes: publishedNotes});
    }));
    const podDstPath = path.join(podDstDir, "notes.json");
    fs.writeJSONSync(podDstPath, payload, { encoding: "utf8", spaces: 2 });
    return { notes: _.values(publishedNotes) };
  }
}
