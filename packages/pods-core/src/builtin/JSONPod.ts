import {
  DVault,
  NotePropsV2,
  NoteUtilsV2,
  PodConfig,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  ExportPod,
  ExportPodCleanConfig,
  ExportPodCleanOpts,
  ExportPodPlantOpts,
  ExportPodRawConfig,
} from "../basev2";
import {
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
  PublishPod,
  PublishPodPlantOpts,
} from "../basev3";

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
    return notes;
  }

  async _entries2Notes(
    entries: Partial<NotePropsV2>[],
    opts: Pick<ImportPodConfig, "concatenate" | "destName"> & {
      vault: DVault;
    }
  ): Promise<NotePropsV2[]> {
    const { vault } = opts;
    const notes = _.map(entries, (ent) => {
      if (!ent.fname) {
        throw Error("fname not defined");
      }
      let fname = ent.fname;
      return NoteUtilsV2.create({ ...ent, fname, vault });
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
        NoteUtilsV2.create({
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

export class JSONExportPod extends ExportPod<
  ExportPodRawConfig,
  ExportPodCleanConfig,
  void
> {
  static id: string = ID;
  static description: string = "export notes as json";

  get config(): PodConfig[] {
    return [
      {
        key: "dest",
        description: "where to export to",
        type: "string" as const,
      },
      {
        key: "includeBody",
        description: "should body be included",
        type: "boolean" as const,
      },
    ];
  }

  // no-op
  async clean(opts: ExportPodCleanOpts<ExportPodRawConfig>) {
    return opts.config;
  }

  async plant(opts: ExportPodPlantOpts<ExportPodCleanConfig>) {
    const { config, engine } = opts;
    // verify dest exist
    const podDstPath = config.dest.fsPath;
    fs.ensureDirSync(path.dirname(podDstPath));

    // parse notes into NoteProps
    const notes = this.preareNotesForExport({
      config,
      notes: _.values(engine.notes),
    });

    fs.writeJSONSync(podDstPath, notes, { encoding: "utf8" });
  }
}
