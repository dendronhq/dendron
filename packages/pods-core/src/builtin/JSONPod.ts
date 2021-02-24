import {
  BasePodExecuteOpts,
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
  ImportPod,
  ImportPodCleanConfig,
  ImportPodCleanOpts,
  ImportPodPlantOpts,
  ImportPodRawConfig,
} from "../basev2";
import { PublishPodPlantOptsV3, PublishPodV3 } from "../basev3";

const ID = "dendron.json";

export type JSONImportPodRawConfig = ImportPodRawConfig & {
  concatenate: boolean;
  destName?: string;
};
export type JSONImportPodCleanConfig = ImportPodCleanConfig & {
  concatenate: boolean;
  destName?: string;
};
export type JSONImportPodResp = any[];

export type JSONImportPodPlantOpts = ImportPodPlantOpts<
  JSONImportPodCleanConfig
>;

export class JSONImportPod extends ImportPod<
  JSONImportPodRawConfig,
  JSONImportPodCleanConfig
> {
  static id: string = ID;
  static description: string = "import json";

  get config() {
    return super.config.concat([
      {
        key: "concatenate",
        description:
          "concatenate all entries into one note? if set to true, need to set `destName`",
        type: "boolean",
        default: false,
      },
      {
        key: "destName",
        description:
          "if `concatenate: true`, specify name of concatenated note",
        type: "string",
      },
    ]);
  }

  async clean(opts: ImportPodCleanOpts<JSONImportPodRawConfig>) {
    return opts.config;
  }

  async plant(opts: JSONImportPodPlantOpts): Promise<JSONImportPodResp> {
    const ctx = "JSONPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const engine = opts.engine;
    const { src, destName, concatenate } = opts.config;
    const entries = fs.readJSONSync(src.fsPath);
    const vault = engine.vaultsv3[0];
    const notes = await this._entries2Notes(entries, {
      vault,
      destName,
      concatenate,
    });
    return Promise.all(
      _.map(notes, (n) => engine.writeNote(n, { newNode: true }))
    );
  }

  async _entries2Notes(
    entries: Partial<NotePropsV2>[],
    opts: Pick<JSONImportPodCleanConfig, "concatenate" | "destName"> & {
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

export class JSONPublishPod extends PublishPodV3 {
  static id: string = ID;
  static description: string = "publish json";

  async plant(opts: PublishPodPlantOptsV3) {
    const note = opts.note;
    const out = JSON.stringify(note, null, 4);
    return { data: out };
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
