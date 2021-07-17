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
    const { notes, dest, engine } = opts;

    const podDstPath = dest.fsPath;
    fs.ensureDirSync(path.dirname(podDstPath));

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

    fs.writeJSONSync(podDstPath, payload, { encoding: "utf8", spaces: 2 });
    return { notes };
  }
}
