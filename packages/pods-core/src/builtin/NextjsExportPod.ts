import { stringifyError } from "@dendronhq/common-all";
import { SiteUtils } from "@dendronhq/engine-server";
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

  async plant(opts: ExportPodPlantOpts) {
    const ctx = `${ID}:plant`
    const { notes, dest, engine } = opts;

    const podDstPath = dest.fsPath;
    const podDstDir = path.dirname(podDstPath);
    fs.ensureDirSync(podDstDir);

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
    fs.ensureDirSync(notesDir);
    await Promise.all(notes.map(async note => {
      const out = await engine.renderNote({id: note.id});
      const dst = path.join(notesDir, note.id + ".html")
      this.L.debug({ctx, dst, msg: "writeNote"});
      if (out.error) {
        throw Error(`error rendering: ${stringifyError(out.error)}`)
      }
      return fs.writeFile(dst, out.data)
    }));
    fs.writeJSONSync(podDstPath, payload, { encoding: "utf8", spaces: 2 });
    return { notes };
  }
}
