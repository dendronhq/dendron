import { DVault, NoteProps, NoteUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  ExportPod,
  ExportPodPlantOpts,
  ExportPodConfig,
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
  PublishPod,
  PublishPodPlantOpts,
} from "../basev3";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";

const ID = "dendron.json";

export type JSONImportPodPlantOpts = ImportPodPlantOpts;

export class JSONImportPod extends ImportPod {
  static id: string = ID;
  static description: string = "import json";

  async plant(opts: JSONImportPodPlantOpts) {
    const ctx = "JSONPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { engine, vault, src } = opts;
    const { destName, concatenate } = opts.config;
    const entries = fs.readJSONSync(src.fsPath);
    const notes = await this._entries2Notes(entries, {
      vault,
      destName,
      concatenate,
    });
    await Promise.all(
      _.map(notes, (n) => engine.writeNote(n, { newNode: true }))
    );
    return { importedNotes: notes };
  }

  async _entries2Notes(
    entries: Partial<NoteProps>[],
    opts: Pick<ImportPodConfig, "concatenate" | "destName"> & {
      vault: DVault;
    }
  ): Promise<NoteProps[]> {
    const { vault } = opts;
    const notes = _.map(entries, (ent) => {
      if (!ent.fname) {
        throw Error("fname not defined");
      }
      let fname = ent.fname;
      return NoteUtils.create({ ...ent, fname, vault });
    });
    if (opts.concatenate) {
      if (!opts.destName) {
        throw Error(
          "destname needs to be specified if concatenate is set to true"
        );
      }
      const acc: string[] = [""];
      _.forEach(notes, (n) => {
        acc.push(`# [[${n.fname}]]`);
        acc.push(n.body);
        acc.push("---");
      });
      return [
        NoteUtils.create({
          fname: opts.destName,
          body: acc.join("\n"),
          vault,
        }),
      ];
    } else {
      return notes;
    }
  }
}

export class JSONPublishPod extends PublishPod {
  static id: string = ID;
  static description: string = "publish json";

  async plant(opts: PublishPodPlantOpts) {
    const note = opts.note;
    const out = JSON.stringify(note, null, 4);
    return out;
  }
}

export class JSONExportPod extends ExportPod {
  static id: string = ID;
  static description: string = "export notes as json";

  get config(): JSONSchemaType<ExportPodConfig> {
    return PodUtils.createExportConfig({
      required: [],
      properties: {},
    }) as JSONSchemaType<ExportPodConfig>;
  }

  async plant(opts: ExportPodPlantOpts) {
    const { dest, notes } = opts;

    // verify dest exist
    const podDstPath = dest.fsPath;
    fs.ensureDirSync(path.dirname(podDstPath));

    fs.writeJSONSync(podDstPath, notes, { encoding: "utf8" });
    return { notes };
  }
}
